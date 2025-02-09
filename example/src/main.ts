// import './style.css';
// import { Sortable } from '../../dist/index.mjs';

// // Simple List
// const example1 = document.getElementById('example1') as HTMLElement;
// new Sortable(example1, {
//   animation: 150,
//   ghostClass: 'opacity-50',
//   onStart: (evt: { item: HTMLElement; oldIndex: number }) => {
//     console.log('Started dragging:', evt.item);
//   },
//   onEnd: (evt: { item: HTMLElement; newIndex: number }) => {
//     console.log('Ended dragging:', evt.item);
//   },
// });

// // Shared Lists
// const example2Left = document.getElementById('example2-left') as HTMLElement;
// const example2Right = document.getElementById('example2-right') as HTMLElement;

// new Sortable(example2Left, {
//   group: 'shared',
//   animation: 150,
//   ghostClass: 'opacity-50',
//   onAdd: (evt: { item: HTMLElement; newIndex: number; from: HTMLElement }) => {
//     console.log('Item added from another list:', evt.item);
//   },
// });

// new Sortable(example2Right, {
//   group: 'shared',
//   animation: 150,
//   ghostClass: 'opacity-50',
//   onAdd: (evt: { item: HTMLElement; newIndex: number; from: HTMLElement }) => {
//     console.log('Item added from another list:', evt.item);
//   },
// });

// // Handle Example
// const example5 = document.getElementById('example5') as HTMLElement;
// new Sortable(example5, {
//   handle: '.handle',
//   animation: 150,
//   ghostClass: 'opacity-50',
// });

// // Grid Example
// const gridDemo = document.getElementById('gridDemo') as HTMLElement;
// new Sortable(gridDemo, {
//   animation: 150,
//   ghostClass: 'opacity-50',
//   draggable: '.grid-item',
// });
