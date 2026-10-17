import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { VerifyKyc } from './verify-kyc';

describe('VerifyKyc', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyKyc],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows the mobile verification flow at the document upload step', () => {
    const fixture = TestBed.createComponent(VerifyKyc);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Verify Your KYB');
    expect(element.querySelectorAll('.step')).toHaveLength(5);
    expect(element.querySelector('.step[aria-current="step"]')?.textContent).toContain('Verify KYC');
    expect(element.querySelector('.step-content h2')?.textContent)
      .toContain('upload your business registration document');
    const documentType = element.querySelector<HTMLSelectElement>('.field select')!;
    expect(documentType.value).toBe('GST Registration');
    expect(Array.from(documentType.options, (option) => option.text)).toEqual([
      'Select Document Type',
      'GST Registration',
      'Udyam Registration Certificate (URC)',
      'Shop & Establishment Certificate',
      'Business/ Trade License',
      'FSSAI',
      'Import Export Certificate',
    ]);
    expect(element.querySelector('.upload-area')?.textContent).toContain('JPG, PNG or PDF, up to 2.5 MB');
    expect(element.querySelector('.button-back')).toBeNull();
    expect(element.querySelector<HTMLButtonElement>('.continue-button')?.disabled).toBe(true);
  });

  it('requires an allowed document file before continuing and supports returning to completed steps', () => {
    const fixture = TestBed.createComponent(VerifyKyc);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;

    const invalidFile = new File(['data'], 'document.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { configurable: true, value: [invalidFile] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Choose a JPG, PNG or PDF');
    expect(element.querySelector<HTMLButtonElement>('.continue-button')?.disabled).toBe(true);

    const validFile = new File(['pdf content'], 'gst-certificate.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { configurable: true, value: [validFile] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(element.querySelector('.selected-file-name')?.textContent)
      .toContain('GST Registration: gst-certificate.pdf');
    expect(element.querySelector('.upload-hint')?.textContent).toBe('11 B');
    expect(element.querySelector('.upload-area-uploaded')).not.toBeNull();
    expect(element.querySelector('.file-picker-uploaded')?.textContent).toContain('Change File');
    expect((element.querySelector('.file-picker-uploaded') as HTMLElement).style.borderColor)
      .toBe('rgb(114, 199, 131)');
    expect(element.querySelector<HTMLButtonElement>('.continue-button')?.disabled).toBe(false);

    expect(fixture.componentInstance.formatFileSize(190_300)).toBe('190.3 KB');
    expect(fixture.componentInstance.formatFileSize(1_500_000)).toBe('1.5 MB');

    element.querySelector<HTMLButtonElement>('.continue-button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('.second-document-skip')!.click();
    fixture.detectChanges();
    expect(element.querySelector('.step[aria-current="step"]')?.textContent).toContain('Address');

    element.querySelector<HTMLButtonElement>('.step[aria-label^="Step 3"]')!.click();
    fixture.detectChanges();
    expect(element.querySelector('.step[aria-current="step"]')?.textContent).toContain('Verify KYC');
  });

  it('opens the second-document bottom sheet and proceeds when skipped', () => {
    const fixture = TestBed.createComponent(VerifyKyc);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    const validFile = new File(['pdf content'], 'gst-certificate.pdf', { type: 'application/pdf' });

    Object.defineProperty(input, 'files', { configurable: true, value: [validFile] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.continue-button')!.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"][aria-modal="true"]')).not.toBeNull();
    expect(element.querySelector('#second-document-title')?.textContent)
      .toContain('Do you have second business');
    expect(element.querySelector('.second-document-upload')?.textContent)
      .toContain('Upload Second Document');

    element.querySelector<HTMLButtonElement>('.second-document-skip')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.querySelector('.step[aria-current="step"]')?.textContent).toContain('Address');
  });

  it('closes the second-document sheet without opening a picker and associates the next file with its selected type', () => {
    const fixture = TestBed.createComponent(VerifyKyc);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const fileInput = element.querySelector<HTMLInputElement>('.upload-area input[type="file"]')!;
    const documentNumber = element.querySelector<HTMLInputElement>('.field input')!;
    const firstFile = new File(['first'], 'gst-certificate.pdf', { type: 'application/pdf' });

    Object.defineProperty(fileInput, 'files', { configurable: true, value: [firstFile] });
    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.continue-button')!.click();
    fixture.detectChanges();

    const dialog = element.querySelector<HTMLElement>('[role="dialog"]')!;
    const filePickerClick = vi.spyOn(fileInput, 'click');
    expect(dialog.querySelector('input[type="file"]')).toBeNull();
    dialog.querySelector<HTMLButtonElement>('.second-document-upload')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.querySelector('.step[aria-current="step"]')?.textContent).toContain('Verify KYC');
    expect(filePickerClick).not.toHaveBeenCalled();
    expect(fileInput.value).toBe('');
    expect(fixture.componentInstance.uploadedDocuments()).toEqual([]);

    const documentType = element.querySelector<HTMLSelectElement>('.field select')!;
    expect(fixture.componentInstance.documentType()).toBe('');
    expect(documentType.value).toBe('');
    expect(documentType.selectedOptions[0].textContent).toBe('Select Document Type');
    expect(fixture.componentInstance.documentNumber()).toBe('');
    expect(documentNumber.value).toBe('');
    expect(element.querySelector<HTMLButtonElement>('.continue-button')?.disabled).toBe(true);
    expect(fileInput.disabled).toBe(true);
    documentType.value = 'FSSAI';
    documentType.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(fileInput.disabled).toBe(false);
    expect(filePickerClick).not.toHaveBeenCalled();

    const secondFile = new File(['second'], 'fssai-certificate.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { configurable: true, value: [secondFile] });
    fileInput.dispatchEvent(new Event('change'));
    documentNumber.value = 'FSSAI-123';
    documentNumber.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.uploadedDocuments()).toEqual([
      { documentType: 'FSSAI', file: secondFile },
    ]);

    element.querySelector<HTMLButtonElement>('.continue-button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('.second-document-skip')!.click();
    fixture.detectChanges();
    expect(element.querySelector('.step[aria-current="step"]')?.textContent).toContain('Address');
  });

  it('only submits after the required final agreement is accepted', () => {
    const fixture = TestBed.createComponent(VerifyKyc);
    const component = fixture.componentInstance;

    component.currentStep.set(4);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector<HTMLButtonElement>('.continue-button')?.disabled).toBe(true);

    element.querySelector<HTMLInputElement>('.consent-field input')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.continue-button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('#complete-title')?.textContent).toContain('Agreement submitted');
  });
});
