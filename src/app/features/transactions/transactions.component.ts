import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { TransactionService } from '../../core/services/transaction.service';
import { TransactionDTO, TransactionType } from '../../core/models';
import { TransactionFormComponent } from './transaction-form/transaction-form.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  TransactionType = TransactionType;

  allTransactions = signal<TransactionDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  filterForm: FormGroup;
  currentFilters = signal<{
    type?: TransactionType;
    category?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  filteredTransactions = computed(() => {
    const transactions = this.allTransactions();
    const filters = this.currentFilters();

    return transactions
      .filter(t => {
        if (filters.type && t.type !== filters.type) return false;
        if (filters.category && !t.category.toLowerCase().includes(filters.category.toLowerCase())) return false;
        if (filters.startDate && t.transactionDate < filters.startDate) return false;
        if (filters.endDate && t.transactionDate > filters.endDate) return false;
        return true;
      })
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  });

  pageSize = signal(10);
  pageIndex = signal(0);

  paginatedTransactions = computed(() => {
    const filtered = this.filteredTransactions();
    const start = this.pageIndex() * this.pageSize();
    return filtered.slice(start, start + this.pageSize());
  });

  displayedColumns = ['type', 'category', 'amount', 'transactionDate', 'description', 'actions'];

  constructor(
    private transactionService: TransactionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
  ) {
    this.filterForm = this.fb.group({
      type: [''],
      category: [''],
      startDate: [null],
      endDate: [null],
    });
  }

  ngOnInit(): void {
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => this.allTransactions.set(transactions));

    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.transactionService.getAllTransactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.loading.set(false);
          this.error.set('Error al cargar transacciones. Intenta de nuevo.');
        }
      });
  }

  applyFilters(): void {
    const { type, category, startDate, endDate } = this.filterForm.value;
    this.currentFilters.set({
      type: type || undefined,
      category: category || undefined,
      startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : undefined,
      endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : undefined,
    });
    this.pageIndex.set(0);
  }

  clearFilters(): void {
    this.filterForm.reset({ type: '', category: '', startDate: null, endDate: null });
    this.currentFilters.set({});
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TransactionFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { transaction: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Transacción creada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openEditDialog(transaction: TransactionDTO): void {
    const dialogRef = this.dialog.open(TransactionFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { transaction }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Transacción actualizada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  confirmDelete(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Eliminar esta transacción? Esta acción no se puede deshacer.')) return;

    this.transactionService.deleteTransaction(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.snackBar.open('Transacción eliminada', 'Cerrar', { duration: 3000 }),
        error: () => this.snackBar.open('Error al eliminar transacción', 'Cerrar', { duration: 3000 })
      });
  }

  formatCurrency(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }
}
