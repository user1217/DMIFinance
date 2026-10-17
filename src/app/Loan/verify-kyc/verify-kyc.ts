import { Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

// Keeps each progress step's full name and compact mobile label together.
interface VerificationStep {
  label: string;
  shortLabel: string;
}

// Associates a selected file with the document category the user chose for it.
interface UploadedDocument {
  documentType: string;
  file: File;
}

// Enforces the size limit consistently for each document selected in this component.
const MAX_FILE_SIZE = 2.5 * 1024 * 1024;
// Defines the MIME types permitted by the file picker and upload validation.
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Component({
  selector: 'app-verify-kyc',
  imports: [RouterLink],
  templateUrl: './verify-kyc.html',
  styleUrl: './verify-kyc.css',
})
export class VerifyKyc {
  // Lets the reset action clear the native input as well as its signal-backed file state.
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // Provides the ordered step metadata shared by the progress bar and step navigation.
  readonly steps: readonly VerificationStep[] = [
    { label: 'Basic details', shortLabel: 'Basic details' },
    { label: 'Loan offers', shortLabel: 'Loan offers' },
    { label: 'Verify KYC', shortLabel: 'Verify KYC' },
    { label: 'Address & e-mandate', shortLabel: 'Address & e-mandate' },
    { label: 'Sign agreement', shortLabel: 'Sign agreement' },
  ];

  // Tracks the active step and supplies the current step's template content.
  readonly currentStep = signal(2);
  // Stores the selected category; it starts with the default GST document type.
  readonly documentType = signal('GST Registration');
  // Holds the registration number used by the KYC step's validation.
  readonly documentNumber = signal('08AAGCL3497D1Z9');
  // Retains uploaded files together with their document type for display and validation.
  readonly uploadedDocuments = signal<UploadedDocument[]>([]);
  // Controls the optional second-document bottom sheet.
  readonly showSecondDocumentPrompt = signal(false);
  // Stores validation feedback for the visible document upload area.
  readonly fileError = signal('');
  // Stores business details entered in the first verification step.
  readonly companyName = signal('');
  readonly businessPan = signal('');
  // Stores the requested loan amount and tenure entered in the offer step.
  readonly loanAmount = signal('');
  readonly loanTenure = signal('');
  // Stores address fields used to validate the e-mandate step.
  readonly address = signal('');
  readonly city = signal('');
  readonly postalCode = signal('');
  // Tracks consent for mandate setup before the user can continue.
  readonly mandateAccepted = signal(false);
  // Tracks final agreement consent before submission is allowed.
  readonly agreementAccepted = signal(false);
  // Switches the form to its completion view once the agreement is submitted.
  readonly submitted = signal(false);

  // Enables Continue only when the active step has all required user input.
  readonly canContinue = computed(() => {
    switch (this.currentStep()) {
      case 0:
        return this.companyName().trim().length > 0 && this.businessPan().trim().length > 0;
      case 1:
        return Number(this.loanAmount()) > 0 && Number(this.loanTenure()) > 0;
      case 2:
        return this.documentNumber().trim().length > 0 && this.uploadedDocuments().length > 0;
      case 3:
        return this.address().trim().length > 0 &&
          this.city().trim().length > 0 &&
          /^\d{6}$/.test(this.postalCode()) &&
          this.mandateAccepted();
      case 4:
        return this.agreementAccepted();
      default:
        return false;
    }
  });

  /** Updates the chosen document category from the native select control. */
  setDocumentType(event: Event): void {
    this.documentType.set((event.target as HTMLSelectElement).value);
  }

  /** Updates the registration number as the user types. */
  setDocumentNumber(event: Event): void {
    this.documentNumber.set((event.target as HTMLInputElement).value);
  }

  /** Updates the registered business name from the first-step input. */
  setCompanyName(event: Event): void {
    this.companyName.set((event.target as HTMLInputElement).value);
  }

  /** Updates the business PAN from the first-step input. */
  setBusinessPan(event: Event): void {
    this.businessPan.set((event.target as HTMLInputElement).value);
  }

  /** Updates the requested loan amount from the offer-step input. */
  setLoanAmount(event: Event): void {
    this.loanAmount.set((event.target as HTMLInputElement).value);
  }

  /** Updates the requested repayment period from the offer-step input. */
  setLoanTenure(event: Event): void {
    this.loanTenure.set((event.target as HTMLInputElement).value);
  }

  /** Updates the registered street address from the address-step input. */
  setAddress(event: Event): void {
    this.address.set((event.target as HTMLInputElement).value);
  }

  /** Updates the city from the address-step input. */
  setCity(event: Event): void {
    this.city.set((event.target as HTMLInputElement).value);
  }

  /** Updates the postal code used by address-step validation. */
  setPostalCode(event: Event): void {
    this.postalCode.set((event.target as HTMLInputElement).value);
  }

  /** Records whether the user accepted the e-mandate authorization. */
  setMandateAccepted(event: Event): void {
    this.mandateAccepted.set((event.target as HTMLInputElement).checked);
  }

  /** Records whether the user accepted the final application agreement. */
  setAgreementAccepted(event: Event): void {
    this.agreementAccepted.set((event.target as HTMLInputElement).checked);
  }

  /** Formats byte counts into readable units for the uploaded-file summary. */
  formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes < 1000) {
      return `${sizeInBytes} B`;
    }
    if (sizeInBytes >= 1_000_000) {
      return `${(sizeInBytes / 1_000_000).toFixed(1)} MB`;
    }
    return `${(sizeInBytes / 1000).toFixed(1)} KB`;
  }

  /** Validates a selected file and stores it against the currently selected document type. */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileError.set('');
    if (!file) return;

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      this.fileError.set('Choose a JPG, PNG or PDF document.');
      input.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.fileError.set('The document must be 2.5 MB or smaller.');
      input.value = '';
      return;
    }

    const selectedDocumentType = this.documentType();
    if (!selectedDocumentType) {
      this.fileError.set('Select a document type first.');
      input.value = '';
      return;
    }

    const uploadedDocument = { documentType: selectedDocumentType, file };
    this.uploadedDocuments.update((documents) => [
      ...documents.filter((document) => document.documentType !== uploadedDocument.documentType),
      uploadedDocument,
    ]);
  }

  /** Allows navigation only to the current step or a previously completed step. */
  goToStep(index: number): void {
    if (index >= 0 && index <= this.currentStep()) {
      this.currentStep.set(index);
    }
  }

  /** Opens the document prompt on KYC and otherwise advances or submits the active step. */
  continue(): void {
    if (!this.canContinue()) return;
    if (this.currentStep() === this.steps.length - 1) {
      this.submitted.set(true);
      return;
    }
    if (this.currentStep() === 2) {
      this.showSecondDocumentPrompt.set(true);
      return;
    }
    this.currentStep.update((step) => step + 1);
  }

  /** Closes the optional-document prompt and advances to the next verification step. */
  skipSecondDocument(): void {
    this.showSecondDocumentPrompt.set(false);
    this.currentStep.update((step) => step + 1);
  }

  /** Closes the prompt and clears prior document inputs without opening the file picker. */
  closeSecondDocumentPrompt(): void {
    this.showSecondDocumentPrompt.set(false);
    this.documentType.set('');
    this.documentNumber.set('');
    this.uploadedDocuments.set([]);
    this.fileError.set('');
    const fileInput = this.fileInput();
    if (fileInput) {
      fileInput.nativeElement.value = '';
    }
  }

  /** Returns the form to its initial entry step after the completion screen. */
  startAgain(): void {
    this.submitted.set(false);
    this.currentStep.set(0);
  }
}
