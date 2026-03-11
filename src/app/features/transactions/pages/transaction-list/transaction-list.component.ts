import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';

import { TransactionService } from '../../../../core/services/transaction.service';
import { TransactionDTO, TransactionType } from '../../../../core/models';
@Component({
    selector: 'app-transaction-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
    ],
    templateUrl: './transaction-list.component.html',
    styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {

    // Signals for state management
    transactions = signal<TransactionDTO[]>([]);
    isLoading = signal<boolean>(true);
    errorMessage = signal<string | null>(null);

    // Filter control
    typeFilter = new FormControl<TransactionType | null>(null);

    // Computed signal for filtered transactions
    filteredTransactions = computed(() => {
        const all = this.transactions();
        const filter = this.typeFilter.value;

        if (!filter) return all;
        return all.filter(t => t.type === filter);
    });

    displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'actions'];

    constructor(private transactionService: TransactionService) {
        // React to filter changes
        this.typeFilter.valueChanges.subscribe(() => {
            // The computed signal will update automatically
        });
    }

    ngOnInit(): void {
        this.loadTransactions();
    }

    loadTransactions(): void {
        this.isLoading.set(true);
        this.transactionService.getAllTransactions().subscribe({
            next: (data) => {
                this.transactions.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading transactions', err);
                this.errorMessage.set('Error al cargar las transacciones. Por favor intente nuevamente.');
                this.isLoading.set(false);
            }
        });
    }

    deleteTransaction(id: number): void {
        if (confirm('¿Estás seguro de eliminar esta transacción?')) {
            this.transactionService.deleteTransaction(id).subscribe({
                next: () => {
                    // Update list locally
                    this.transactions.update(current => current.filter(t => t.id !== id));
                },
                error: (err) => {
                    console.error('Error deleting transaction', err);
                    alert('Error al eliminar la transacción');
                }
            });
        }
    }

    resetFilters(): void {
        this.typeFilter.setValue(null);
    }
}
