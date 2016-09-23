
const {bootstrap, CustomComponent} = window;

const view = `<div>
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
</div>`;

function model(input$) {
  const name$ = input$.on('name').startWith('Nathan');
  
  const values$ = input$.on('boost')
  .startWith({})
  .scan((a, b)=> a + 1, -1)
  .scan(function(values, i) {
    return values.concat(_.times(2000, j=> j));
  }, []);

  return {
    name: name$,
    disabled: input$.on('disabled').startWith(true),
    body: Observable.of('Booya'),
    values: values$,
    booya: Observable.of('https://cdn.psychologytoday.com/sites/default/files/blogs/38/2008/12/2598-75772.jpg'),
  };
}

const component = Component({
  props: [],
  exposes: [],
  view,
  model,
});

bootstrap(document.getElementById('root'), component);
