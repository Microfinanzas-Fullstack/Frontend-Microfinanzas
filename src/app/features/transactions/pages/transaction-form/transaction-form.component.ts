import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Observable, startWith, map } from 'rxjs';

import { TransactionService } from '../../../../core/services/transaction.service';
import { CreateTransactionDTO, TransactionDTO } from '../../../../core/models';
@Component({
    selector: 'app-transaction-form',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule,
        MatAutocompleteModule,
        MatProgressSpinnerModule,
        MatCardModule,
    ],
    templateUrl: './transaction-form.component.html',
    styleUrls: ['./transaction-form.component.css']
})
export class TransactionFormComponent implements OnInit {
    transactionForm: FormGroup;
    isEditMode = false;
    transactionId: number | null = null;
    isLoading = false;
    errorMessage: string | null = null;

    // Categorías sugeridas
    categories: string[] = ['Alimentación', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Educación', 'Salario', 'Inversiones', 'Otros'];
    filteredCategories: Observable<string[]> | undefined;

    constructor(
        private fb: FormBuilder,
        private transactionService: TransactionService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.transactionForm = this.fb.group({
            type: ['EXPENSE', Validators.required],
            amount: [null, [Validators.required, Validators.min(0.01)]],
            currency: ['USD', Validators.required],
            category: ['', Validators.required],
            transactionDate: [new Date(), Validators.required],
            description: ['']
        });
    }

    ngOnInit(): void {
        // Autocomplete filter
        this.filteredCategories = this.transactionForm.get('category')!.valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value || '')),
        );

        // Check for Edit Mode
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.isEditMode = true;
            this.transactionId = +idParam; // Convert to number
            this.loadTransaction(this.transactionId);
        }
    }

    private _filter(value: string): string[] {
        const filterValue = value.toLowerCase();
        return this.categories.filter(option => option.toLowerCase().includes(filterValue));
    }

    loadTransaction(id: number): void {
        this.isLoading = true;
        this.transactionService.getTransactionById(id).subscribe({
            next: (transaction) => {
                this.transactionForm.patchValue({
                    type: transaction.type,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    category: transaction.category,
                    transactionDate: new Date(transaction.transactionDate), // Ensure Date object
                    description: transaction.description
                });
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading transaction', err);
                this.errorMessage = 'Error al cargar la transacción';
                this.isLoading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.transactionForm.invalid) {
            return;
        }

        this.isLoading = true;
        const formValue = this.transactionForm.value;

        // Fix timezone issue: User selects local date, but toISOString() converts to UTC
        // which might be tomorrow. Manually format as YYYY-MM-DD in local time.
        const date = new Date(formValue.transactionDate);
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const dateString = `${year}-${month}-${day}`;

        const transactionDTO: CreateTransactionDTO = {
            ...formValue,
            transactionDate: dateString
        };

        if (this.isEditMode && this.transactionId) {
            this.transactionService.updateTransaction(this.transactionId, transactionDTO).subscribe({
                next: () => {
                    this.router.navigate(['/transactions']);
                },
                error: (err) => {
                    console.error('Error updating', err);
                    this.errorMessage = 'Error al actualizar la transacción';
                    this.isLoading = false;
                }
            });
        } else {
            this.transactionService.createTransaction(transactionDTO).subscribe({
                next: () => {
                    this.router.navigate(['/transactions']);
                },
                error: (err) => {
                    console.error('Error creating', err);
                    this.errorMessage = 'Error al crear la transacción';
                    this.isLoading = false;
                }
            });
        }
    }
}
