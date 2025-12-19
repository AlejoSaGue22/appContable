import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { LoaderService } from 'src/app/utils/services/loader.service';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, LoaderComponent],
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent {
  
  loader = inject(LoaderService);
  
  isLoading = computed(() => this.loader.getLoading());
  

    
}
