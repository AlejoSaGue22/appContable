import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';
import { ImpuestosListComponent } from './components/impuestos-list/impuestos-list.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ImpuestosService } from './services/impuestos.service';
import { Impuesto } from './interfaces/impuesto.interface';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { firstValueFrom } from 'rxjs';
import { PaginationComponent } from "@shared/components/pagination/pagination";
import { PaginationService } from '@shared/components/pagination/pagination.service';

@Component({
  selector: 'app-config-impuestos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderTitlePageComponent, ImpuestosListComponent, ModalComponent, PaginationComponent],
  templateUrl: './impuestos.component.html',
})
export class ImpuestosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private impuestosService = inject(ImpuestosService);
  private cuentasService = inject(CuentasContablesService);
  private paginationService = inject(PaginationService);

  headTitle = signal<HeaderInput>({
    title: 'Impuestos',
    slog: 'Define los tipos de impuestos y retenciones que aplicas en tus transacciones'
  });

  impuestos = signal<Impuesto[]>([]);
  cuentas = signal<any[]>([]);
  cuentasFiltradas = computed(() => {
    return this.cuentas().filter(c => 
      c.aceptaMovimiento && 
      (c.codigo.startsWith('1355') || 
       c.codigo.startsWith('24') || 
       c.codigo.startsWith('2365') || 
       c.codigo.startsWith('2367') || 
       c.codigo.startsWith('2368') || 
       c.codigo.startsWith('2370'))
    );
  });
  loading = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  selectedId = signal<string | null>(null);
  showAdvanced = signal<boolean>(false);

  taxForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    tipo: ['IVA', [Validators.required]],
    tarifa: [0, [Validators.required, Validators.min(0)]],
    descripcion: [''],
    activo: [true],
    isAcreditable: [false],
    cuentaVentasId: [null],
    cuentaComprasId: [null],
    cuentaDevVentasId: [null],
    cuentaDevComprasId: [null]
  });

  ngOnInit(): void {
    this.loadData();
    this.loadCuentas();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.impuestosService.getAll());
      this.impuestos.set(data);
      this.paginationService.totalItems.set(data.length);
      const pageSize = data.length > 0 ? Math.ceil(data.length / 10) : 1; // Default page size of 10
      this.paginationService.pageSize.set(pageSize);
    } catch (error) {
      console.error('Error loading taxes', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadCuentas() {
    try {
      const data = await firstValueFrom(this.cuentasService.getCuentasContables());
      this.cuentas.set(data);
    } catch (error) {
      console.error('Error loading accounts', error);
    }
  }

  openNew() {
    this.isEditing.set(false);
    this.selectedId.set(null);
    this.taxForm.reset({
      activo: true,
      tipo: 'IVA',
      tarifa: 0,
      isAcreditable: false
    });
    this.modalVisible.set(true);
  }

  async onEdit(impuesto: Impuesto) {
    const id = impuesto.id;
    if(!id){
      return;
    }
    this.isEditing.set(true);
    this.selectedId.set(id);
    try {
      const data = await firstValueFrom(this.impuestosService.getById(id));
      this.taxForm.patchValue(data);
      this.modalVisible.set(true);
    } catch (error) {
      console.error('Error fetching tax details', error);
    }
  }

  async save() {
    if (this.taxForm.invalid) return;

    const data = this.taxForm.value;
    try {
      if (this.isEditing() && this.selectedId()) {
        await firstValueFrom(this.impuestosService.update(this.selectedId()!, data));
      } else {
        await firstValueFrom(this.impuestosService.create(data));
      }
      this.modalVisible.set(false);
      this.loadData();
    } catch (error) {
      console.error('Error saving tax', error);
    }
  }

  toggleAdvanced() {
    this.showAdvanced.update(v => !v);
  }
}
