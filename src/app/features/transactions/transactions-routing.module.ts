import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/transaction-list/transaction-list.component').then(m => m.TransactionListComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./pages/transaction-form/transaction-form.component').then(m => m.TransactionFormComponent)
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./pages/transaction-form/transaction-form.component').then(m => m.TransactionFormComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TransactionsRoutingModule { }
