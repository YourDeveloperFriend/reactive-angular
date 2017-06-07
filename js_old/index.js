'use strict';

var AppView = '<div>\n  {{name}}\n  <h1>{{name}} {{body}}</h1>\n  <input type="text" [(ngModel)]="name" />\n  <ul>\n    <li>before</li>\n    <!--li *ngFor="let value of values trackBy value"><span>{{value}}</span> <span>{{name}}</span></li-->\n    <li>after</li>\n  </ul>\n  <button (click)="boost" [disabled]="disabled" >Click</button>\n  <input type="checkbox" [(ngModel)]="disabled" /> Disabled\n  <!--div *ngIf="disabled">Hidden!</div-->\n  <Child title="What!" [inside]="name" (custom)="hoo" />\n</div>';

var ChildView = '<div>\n  <h1>{{title}}: {{inside}}</h1>\n  <input ngModel="five" />\n  <button (click)="booya">Submit!</button>\n</div>';

function AppModel(input$) {
  var name$ = input$.on('name').startWith('Nathan');

  var values$ = input$.on('boost').startWith({}).scan(function (a, b) {
    return a + 1;
  }, -1).scan(function (values, i) {
    return values.concat([i]);
  }, []);

  var disabled = input$.on('disabled').startWith(false).merge(input$.on('hoo').map(function (a) {
    return true;
  }));

  return {
    name: name$,
    disabled: disabled,
    body: Observable.just('Booya'),
    values: values$,
    booya: Observable.just('https://cdn.psychologytoday.com/sites/default/files/blogs/38/2008/12/2598-75772.jpg')
  };
}

function ChildModel(input$) {
  var title$ = input$.prop('title');
  return {
    title: title$,
    five: input$.on('five'),
    custom: input$.on('booya'),
    inside: input$.prop('inside')
  };
}

var AppComponent = Component(parse(AppView), AppModel);
var ChildComponent = Component(parse(ChildView), ChildModel, ['custom']);

bootstrap(document.getElementById('root'), AppComponent);