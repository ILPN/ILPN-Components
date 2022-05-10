import {NgModule} from '@angular/core';
import {FooterComponent} from './layout/footer/footer.component';
import {PageLayoutComponent} from './layout/page-layout/page-layout.component';
import {FileUploadComponent} from './interaction/file-upload/file-upload.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FileDownloadComponent} from './interaction/file-download/file-download.component';
import {DescriptiveLinkComponent} from './interaction/descriptive-link/descriptive-link.component';


@NgModule({
    declarations: [
        FooterComponent,
        PageLayoutComponent,
        FileUploadComponent,
        FileDownloadComponent,
        DescriptiveLinkComponent
    ],
    imports: [
        FlexLayoutModule
    ],
    exports: [
        FooterComponent,
        PageLayoutComponent,
        FileUploadComponent,
        FileDownloadComponent,
        DescriptiveLinkComponent,
    ]
})
export class IlpnComponentsModule {
}
