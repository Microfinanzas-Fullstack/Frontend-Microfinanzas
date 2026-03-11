import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SubscriptionService } from '../../../core/services/subscription.service';
import { CreateSubscriptionDTO } from '../../../core/models';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './subscription-form.component.html',
  styleUrl: './subscription-form.component.css'
})
export class SubscriptionFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error: string | null = null;

  readonly currencies = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'PEN', 'CLP', 'BRL'];
  readonly billingCycles = [
    { label: 'Semanal (7 días)', days: 7 },
    { label: 'Quincenal (15 días)', days: 15 },
    { label: 'Mensual (30 días)', days: 30 },
    { label: 'Trimestral (90 días)', days: 90 },
    { label: 'Semestral (180 días)', days: 180 },
    { label: 'Anual (365 días)', days: 365 },
  ];

  constructor(
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService,
    public dialogRef: MatDialogRef<SubscriptionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Record<string, never>
  ) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      currency: ['USD', Validators.required],
      billingCycleDays: [30, Validators.required],
      nextBillingDate: [tomorrow, Validators.required],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const rawDate: Date = this.form.value.nextBillingDate;
    const payload: CreateSubscriptionDTO = {
      name: this.form.value.name.trim(),
      description: this.form.value.description?.trim() || undefined,
      amount: Number(this.form.value.amount),
      currency: this.form.value.currency,
      billingCycleDays: Number(this.form.value.billingCycleDays),
      nextBillingDate: rawDate.toISOString().split('T')[0],
    };

    this.subscriptionService.createSubscription(payload).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.status === 400
          ? 'Datos inválidos. Revisa los campos.'
          : 'Error al crear. Intenta de nuevo.';
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
