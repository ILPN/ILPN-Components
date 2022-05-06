import {NgModule} from '@angular/core';
import {FooterComponent} from './layout/footer/footer.component';
import {PageLayoutComponent} from './layout/page-layout/page-layout.component';


@NgModule({
    declarations: [
        FooterComponent,
        PageLayoutComponent
    ],
    imports: [],
    exports: [
        FooterComponent,
        PageLayoutComponent
    ]
})
export class IlpnComponentsModule {
}
