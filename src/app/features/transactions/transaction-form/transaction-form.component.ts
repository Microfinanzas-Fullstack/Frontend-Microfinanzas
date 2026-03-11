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

import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDTO, CreateTransactionDTO, TransactionType } from '../../../core/models';

export interface TransactionFormData {
  transaction: TransactionDTO | null;
}

@Component({
  selector: 'app-transaction-form',
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
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.css'
})
export class TransactionFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error: string | null = null;

  TransactionType = TransactionType;
  isEditMode: boolean;

  readonly currencies = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'PEN', 'CLP', 'BRL'];
  readonly categoriesByType: Record<string, string[]> = {
    INCOME: ['Salario', 'Freelance', 'Inversiones', 'Ventas', 'Bonos', 'Dividendos', 'Otros'],
    EXPENSE: ['Alimentación', 'Transporte', 'Vivienda', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Servicios', 'Tecnología', 'Otros'],
  };

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    public dialogRef: MatDialogRef<TransactionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionFormData
  ) {
    this.isEditMode = !!data.transaction;

    this.form = this.fb.group({
      amount: [
        data.transaction?.amount ?? '',
        [Validators.required, Validators.min(0.01)]
      ],
      currency: [data.transaction?.currency ?? 'USD', Validators.required],
      type: [data.transaction?.type ?? '', Validators.required],
      category: [data.transaction?.category ?? '', Validators.required],
      description: [data.transaction?.description ?? ''],
      transactionDate: [
        data.transaction?.transactionDate
          ? new Date(data.transaction.transactionDate)
          : new Date(),
        Validators.required
      ],
    });
  }

  ngOnInit(): void {}

  get availableCategories(): string[] {
    const type = this.form.get('type')?.value as string;
    return type ? (this.categoriesByType[type] ?? []) : [];
  }

  onTypeChange(): void {
    this.form.get('category')?.setValue('');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const rawDate: Date = this.form.value.transactionDate;
    const payload: CreateTransactionDTO = {
      amount: Number(this.form.value.amount),
      currency: this.form.value.currency,
      type: this.form.value.type as TransactionType,
      category: this.form.value.category,
      description: this.form.value.description?.trim() || undefined,
      transactionDate: rawDate.toISOString().split('T')[0],
    };

    const operation$ = this.isEditMode
      ? this.transactionService.updateTransaction(this.data.transaction!.id, payload)
      : this.transactionService.createTransaction(payload);

    operation$.subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.status === 400
          ? 'Datos inválidos. Revisa los campos.'
          : 'Error al guardar. Intenta de nuevo.';
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
