import {NgModule} from '@angular/core';
import {FooterComponent} from './layout/footer/footer.component';
import {PageLayoutComponent} from './layout/page-layout/page-layout.component';
import {FileUploadComponent} from './interaction/file-upload/file-upload.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FileDownloadComponent} from './interaction/file-download/file-download.component';
import {DescriptiveLinkComponent} from './interaction/descriptive-link/descriptive-link.component';
import { InfoCardComponent } from './interaction/info-card/info-card.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { FileDisplayComponent } from './interaction/file-display/file-display.component';
import {ReactiveFormsModule} from '@angular/forms';


@NgModule({
    declarations: [
        FooterComponent,
        PageLayoutComponent,
        FileUploadComponent,
        FileDownloadComponent,
        DescriptiveLinkComponent,
        InfoCardComponent,
        FileDisplayComponent
    ],
	imports: [
		FlexLayoutModule,
		BrowserAnimationsModule,
		ReactiveFormsModule
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
