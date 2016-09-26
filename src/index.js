
const AppView = `<div>
  {{name}}
  <h1>{{name}} {{body}}</h1>
  <input type="text" [(ngModel)]="name" />
  <ul>
    <li>before</li>
    <li *ngFor="let value of values"><span>{{value}}</span> <span>{{name}}</span></li>
    <li>after</li>
  </ul>
  <button (click)="boost" [disabled]="disabled" >Click</button>
  <input type="checkbox" [(ngModel)]="disabled" /> Disabled
  <div *ngIf="disabled">Hidden!</div>
  <Child title="What!" [inside]="name" (custom)="hoo" />
</div>`;


const ChildView = `<div>
  <h1>{{title}}: {{inside}}</h1>
  <input ngModel="five" />
  <button (click)="booya">Submit!</button>
</div>`;

function AppModel(input$) {
  const name$ = input$.on('name').toProperty('Nathan');

  const values$ = input$.on('boost')
  .scan(-1, (a, b)=> a + 1, -1)
  .scan([], function(values, i) {
    return values.concat([i]);
  }).toProperty([]);
  
  const disabled = input$.on('disabled').merge(input$.on('hoo')).toProperty(true);

  return {
    name: name$,
    disabled: disabled,
    body: Bacon.constant('Booya'),
    values: values$,
    booya: Bacon.constant('https://cdn.psychologytoday.com/sites/default/files/blogs/38/2008/12/2598-75772.jpg'),
  };
}

function ChildModel(input$) {
  const title$ = input$.prop('title');
  return {
    title: title$,
    five: input$.on('five'),
    custom: input$.on('booya'),
    inside: input$.prop('inside'),
  };
}

const AppComponent = Component(parse(AppView), AppModel);
const ChildComponent = Component(parse(ChildView), ChildModel, ['custom']);

bootstrap(document.getElementById('root'), AppComponent);
