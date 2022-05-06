import {NgModule} from '@angular/core';
import {FooterComponent} from './layout/footer/footer.component';
import {PageLayoutComponent} from './layout/page-layout/page-layout.component';
import {FileUploadComponent} from './interaction/file-upload/file-upload.component';
import {FlexLayoutModule} from '@angular/flex-layout';


@NgModule({
    declarations: [
        FooterComponent,
        PageLayoutComponent,
        FileUploadComponent
    ],
    imports: [
        FlexLayoutModule
    ],
    exports: [
        FooterComponent,
        PageLayoutComponent,
        FileUploadComponent,
    ]
})
export class IlpnComponentsModule {
}
