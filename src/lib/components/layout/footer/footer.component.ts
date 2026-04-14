import {Component, Input} from '@angular/core';
import {Person} from "../person";

@Component({
    selector: 'ilpn-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

    @Input()
    public sourceLink?: string;

    @Input()
    public people?: Person | Array<Person>;

    protected isDefined(): boolean {
        return this.people !== undefined && (!Array.isArray(this.people) || this.people.length > 0)
    }

    protected isSingular(): boolean {
        return !!this.people && (!Array.isArray(this.people) || this.people.length === 1);
    }

    protected get person(): Person | undefined {
        if (!this.isDefined()) {
            return undefined;
        }
        return !Array.isArray(this.people) ? this.people : this.people[0];
    }

    protected get peopleArr(): Array<Person> {
        if (!this.isDefined()) {
            return [];
        }
        if (this.isSingular()) {
            return [this.person!]
        }
        return this.people as Array<Person>;
    }

    protected trackByName(index: number, p: Person): string {
        return p.name;
    }
}
