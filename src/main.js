
const template = `<div>
  <h1>Hello, {{name}}</h1>
  <input [(ngModel)]="name" />
<ul>
<li *ngFor="item of items">{{item}} <button (click)="remove(item)">x</button></li>
</ul>
<button (click)="addItem()">Add</button>
<Child (addItem)="addTwoItems()" input="{{name}}" />
<input type="checkbox" [(ngModel)]="show" /> Show
<p *ngIf="show">Appear</p>
</div>`;

const childTemplate = `<div>
Child!
<button (click)="emitParent()">Emit Parent: {{input}}</button>
</div>`;

function appModel(input) {
  const items$ = 
  return {
    name: input.event('name'),
    remove: input.event('name'),
  };
}
