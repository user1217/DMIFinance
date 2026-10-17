import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { LOAN_APPLICATIONS_API_URL } from './service/loan-application.service';
import { LEADS_DATA_URL } from './service/lead.service';

describe('App', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('shows the centered dashboard launcher at the root route', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Choose a dashboard');
    expect(Array.from(element.querySelectorAll('.dashboard-link-copy strong')).map((label) => label.textContent?.trim()))
      .toEqual(['1 - Loan Dashboard', '2 - Figma Loan Dashboard', '3 - Verify KYC']);
    expect(element.querySelector('.dashboard-launcher')).not.toBeNull();
    httpTesting.expectNone(LOAN_APPLICATIONS_API_URL);
  });

  it('opens the existing lead dashboard from the second launcher link', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLAnchorElement>('[routerLink="/figma-loan-dashboard"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    httpTesting.expectOne(LEADS_DATA_URL).flush([]);
    fixture.detectChanges();

    expect(router.url).toBe('/figma-loan-dashboard');
    expect(element.querySelector('.dashboard-launcher')).toBeNull();
    expect(element.querySelector('h1')?.textContent).toContain('Loan Dashboard');
  });

  it('keeps links one and three blank and restores the launcher on back navigation', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLAnchorElement>('[routerLink="/loan-application-dashboard"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/loan-application-dashboard');
    expect(element.querySelector('.dashboard-launcher')).toBeNull();

    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('.dashboard-launcher')).not.toBeNull();

    element.querySelector<HTMLAnchorElement>('[routerLink="/verify-kyc"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/verify-kyc');
    expect(element.querySelector('.dashboard-launcher')).toBeNull();
  });

  it('keeps the loan application dashboard available at its dedicated route', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/loan-applications');
    await fixture.whenStable();
    fixture.detectChanges();
    httpTesting.expectOne(LOAN_APPLICATIONS_API_URL).flush([]);
    fixture.detectChanges();

    expect(router.url).toBe('/loan-applications');
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent)
      .toContain('Loan applications');
  });
});
