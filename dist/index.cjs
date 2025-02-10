"use strict";var j=Object.defineProperty;var G=(s,t,e)=>t in s?j(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var l=(s,t,e)=>G(s,typeof t!="symbol"?t+"":t,e);Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});function W(s){return"touches"in s}function V(s){return"pointerType"in s}function C(s){return W(s)&&s.touches[0]?s.touches[0]:V(s)&&s.pointerType==="touch"?s:null}function O(s){const t=C(s);return t?{clientX:t.clientX,clientY:t.clientY}:"clientX"in s?{clientX:s.clientX,clientY:s.clientY}:null}const P={capture:!1,passive:!1},E=class E{constructor(){l(this,"tasks",new Map)}static getInstance(){return E.instance||(E.instance=new E),E.instance}removeEventListener(t,e,n){t.removeEventListener(e,n,P)}registerEventListener(t,e,n,i){e.addEventListener(n,i,P),this.addTask(t,{type:"event",cleanup:()=>this.removeEventListener(e,n,i)})}registerTimer(t,e){this.addTask(t,{type:"timer",cleanup:()=>clearTimeout(e)})}registerAnimationCleanup(t,e){this.addTask(t,{type:"animation",cleanup:e})}registerCustomCleanup(t,e){this.addTask(t,{type:"custom",cleanup:e})}addTask(t,e){this.tasks.has(t)||this.tasks.set(t,new Set),this.tasks.get(t).add(e)}cleanup(t){const e=this.tasks.get(t);e&&(e.forEach(n=>n.cleanup()),this.tasks.delete(t))}cleanupAll(){this.tasks.forEach((t,e)=>{this.cleanup(e)}),this.tasks.clear()}};l(E,"instance");let S=E;const D=Symbol("SortableInstance"),b=class b{constructor(){l(this,"state");l(this,"listeners",new Set);l(this,"cleanupManager");this.state={activeSortable:null,instances:new Map,dragOperation:{active:!1,sourceEl:null,dragEl:null,ghostEl:null,cloneEl:null,parentEl:null,nextEl:null,lastDownEl:null,oldIndex:null,newIndex:null,oldDraggableIndex:null,newDraggableIndex:null,moved:!1,position:{clientX:0,clientY:0,initialX:0,initialY:0,dx:0,dy:0}}},this.cleanupManager=S.getInstance()}static getInstance(){return b.instance||(b.instance=new b),b.instance}registerInstance(t,e){if(this.state.instances.has(t))throw new Error("Instance already registered for element");this.state.instances.set(t,e),t[D]=e,this.notifyListeners()}destroyInstance(t){this.cleanupManager.cleanup(t);let e=null;this.state.instances.forEach((n,i)=>{n.instanceId===t&&(e=i)}),e&&this.removeInstance(e)}removeInstance(t){this.state.instances.delete(t),delete t[D],this.notifyListeners()}getInstance(t){const e=this.state.instances.get(t);return e||t[D]}subscribe(t){return this.listeners.add(t),()=>this.listeners.delete(t)}notifyListeners(){const t=this.getState();this.listeners.forEach(e=>e(t))}getState(){return Object.freeze({...this.state})}startDrag(t,e=0,n=0){if(this.state.dragOperation.active)throw new Error("Drag operation already in progress");const i=this.getInstance(t);if(!i)throw new Error("No sortable instance found for element");this.state.activeSortable=i,this.state.dragOperation={...this.state.dragOperation,active:!0,sourceEl:t,oldIndex:this.getElementIndex(t),position:{clientX:e,clientY:n,initialX:e,initialY:n,dx:0,dy:0}},this.notifyListeners()}updateDragPosition(t,e){const n=this.state.dragOperation.position;this.state.dragOperation.position={clientX:t,clientY:e,initialX:n.initialX,initialY:n.initialY,dx:t-n.clientX,dy:e-n.clientY},this.notifyListeners()}updateDragElements(t){this.state.dragOperation={...this.state.dragOperation,...t},this.notifyListeners()}endDrag(){this.state.activeSortable=null,this.state.dragOperation={...this.state.dragOperation,active:!1,sourceEl:null,dragEl:null,ghostEl:null,cloneEl:null,oldIndex:null,newIndex:null},this.notifyListeners()}updateScrollPosition(t,e){this.state.dragOperation.position={...this.state.dragOperation.position,dx:this.state.dragOperation.position.dx+e,dy:this.state.dragOperation.position.dy+t},this.notifyListeners()}getElementFromPoint(t,e){const n=this.state.dragOperation.dragEl;if(n){const i=n.style.display;n.style.display="none";const a=document.elementFromPoint(t,e);return n.style.display=i,a}return document.elementFromPoint(t,e)}getEventTarget(t){const{target:e}=t;if(!(e instanceof HTMLElement))return null;if(e.shadowRoot){const n=C(t);if(n){const i=e.shadowRoot.elementFromPoint(n.clientX,n.clientY);if(i instanceof HTMLElement)return i}}return e}getElementIndex(t){var e;return Array.from(((e=t.parentElement)==null?void 0:e.children)||[]).indexOf(t)}getActiveSortable(){return this.state.activeSortable}getDragOperation(){return Object.freeze({...this.state.dragOperation})}hasInstance(t){return this.state.instances.has(t)||D in t}getInstanceCount(){return this.state.instances.size}reset(){this.state.instances.forEach((t,e)=>this.removeInstance(e)),this.endDrag(),this.listeners.clear()}};l(b,"instance");let M=b;const R=(s,t)=>{var e;if(!t||!s)return!1;t[0]===">"&&(t=t.substring(1));try{return((e=s.matches)==null?void 0:e.call(s,t))||!1}catch{return!1}},q=s=>s.host&&s!==document&&s.host.nodeType?s.host:s.parentNode,w=(s,t,e=document,n=!1)=>{if(!s)return null;let i=s;do{if(t!=null&&(t[0]===">"?i.parentNode===e&&R(i,t):R(i,t))||n&&i===e)return i;if(i===e)break}while(i=q(i));return null},T=(s,t,e)=>{var n;!s||!t||(n=s.classList)==null||n[e?"add":"remove"](t)},h=(s,t,e)=>{if(s!=null&&s.style){if(typeof t=="object"){Object.entries(t).forEach(([n,i])=>{!(n in s.style)&&!n.startsWith("webkit")&&(n=`-webkit-${n}`),s.style[n]=`${i}${typeof i=="string"?"":"px"}`});return}if(e===void 0)return getComputedStyle(s)[t];!(t in s.style)&&!t.startsWith("webkit")&&(t=`-webkit-${t}`),s.style[t]=`${e}${typeof e=="string"?"":"px"}`}},x=(s,t=!1)=>{let e="";if(typeof s=="string")e=s;else{let i=s;do{const a=h(i,"transform");a&&a!=="none"&&(e=`${a} ${e}`)}while(!t&&(i=i.parentElement))}const n=window.DOMMatrix||window.WebKitCSSMatrix||window.CSSMatrix||window.MSCSSMatrix;return n?new n(e):null},f=(s,t=!1,e=!1,n=!1,i)=>{if(s===window)return{top:0,left:0,bottom:window.innerHeight,right:window.innerWidth,width:window.innerWidth,height:window.innerHeight,x:0,y:0,toJSON(){return{x:this.x,y:this.y,top:this.top,right:this.right,bottom:this.bottom,left:this.left,width:this.width,height:this.height}}};const a=s.getBoundingClientRect();let r=a.top,o=a.left,d=a.bottom,u=a.right,{width:p,height:g}=a;if((t||e)&&s!==window){i=i||s.parentNode;do if(i!=null&&i.getBoundingClientRect&&(h(i,"transform")!=="none"||e&&h(i,"position")!=="static")){const c=i.getBoundingClientRect(),m=parseInt(h(i,"border-top-width"))||0,y=parseInt(h(i,"border-left-width"))||0;r-=c.top+m,o-=c.left+y,d=r+a.height,u=o+a.width;break}while(i=i.parentNode)}if(n&&s!==window){const c=x(i||s);if(c){const{a:m,d:y}=c;r/=y,o/=m,p/=m,g/=y,d=r+g,u=o+p}}return{top:r,left:o,bottom:d,right:u,width:p,height:g,x:o,y:r,toJSON(){return{x:this.x,y:this.y,top:this.top,right:this.right,bottom:this.bottom,left:this.left,width:this.width,height:this.height}}}};function J(s,t){for(let e=0;e<s.length;e++)if(Object.keys(t).every(i=>t[i]===s[e][i]))return e;return-1}const $=(s,t)=>Math.round(s.top)===Math.round(t.top)&&Math.round(s.left)===Math.round(t.left)&&Math.round(s.height)===Math.round(t.height)&&Math.round(s.width)===Math.round(t.width),K=(s,t,e,n)=>{const i=Math.pow(t.top-s.top,2),a=Math.pow(t.left-s.left,2),r=Math.pow(t.top-e.top,2),o=Math.pow(t.left-e.left,2);return Math.sqrt(i+a)/Math.sqrt(r+o)*(n.animation||0)},Q=s=>s.offsetWidth,N=(s,t,e,n,i)=>{if(!n)return;h(s,"transition",""),h(s,"transform","");const a=x(s),r=(a==null?void 0:a.a)||1,o=(a==null?void 0:a.d)||1,d=(t.left-e.left)/r,u=(t.top-e.top)/o;s.animatingX=!!d,s.animatingY=!!u,h(s,"transform",`translate3d(${d}px,${u}px,0)`),Q(s),h(s,"transition",`transform ${n}ms${i.easing?" "+i.easing:""}`),h(s,"transform","translate3d(0,0,0)"),s.animated&&clearTimeout(s.animated),s.animated=window.setTimeout(()=>{h(s,"transition",""),h(s,"transform",""),s.animated=!1,s.animatingX=!1,s.animatingY=!1},n)};class z{constructor(t){l(this,"animationStates",[]);l(this,"animationCallbackId");l(this,"sortable");l(this,"state");l(this,"cleanupManager");l(this,"instanceId");this.sortable=t,this.state=M.getInstance(),this.cleanupManager=S.getInstance(),this.instanceId=Symbol("AnimationStateManager")}captureAnimationState(){if(this.animationStates=[],!this.sortable.options.animation)return;const t=this.state.getDragOperation();Array.from(this.sortable.el.children).forEach(n=>{if(!(n instanceof HTMLElement)||h(n,"display")==="none"||n===t.ghostEl)return;const i={target:n,rect:f(n)};this.animationStates.push(i);const a={...i.rect};n.thisAnimationDuration&&this.compensateForAnimation(n,a),n.fromRect=a})}addAnimationState(t){this.animationStates.push(t)}removeAnimationState(t){const e=J(this.animationStates,{target:t});e!==-1&&this.animationStates.splice(e,1)}animateAll(t){if(!this.sortable.options.animation){this.clearAnimation(t);return}const{animating:e,maxDuration:n}=this.processAnimationStates();this.scheduleCallback(e,n,t),this.animationStates=[]}animate(t,e,n,i){N(t,e,n,i,this.sortable.options)}compensateForAnimation(t,e){const n=getComputedStyle(t).transform;if(n&&n!=="none"){const i=new DOMMatrix(n);return new DOMRect(e.x-i.m41,e.y-i.m42,e.width,e.height)}return e}processAnimationStates(){let t=!1,e=0;return this.animationStates.forEach(n=>{const i=this.calculateAnimationDuration(n);i&&(t=!0,e=Math.max(e,i),this.setupAnimationReset(n.target,i))}),{animating:t,maxDuration:e}}calculateAnimationDuration(t){const{target:e}=t,n=f(e);let i=0;return e.thisAnimationDuration&&e.prevFromRect&&e.prevToRect&&$(e.prevFromRect,n)&&(i=K(t.rect,e.prevFromRect,e.prevToRect,this.sortable.options)),e.fromRect&&!$(n,e.fromRect)&&(this.updateAnimationTracking(e,n),i||(i=this.sortable.options.animation||0),this.animate(e,t.rect,n,i)),i}updateAnimationTracking(t,e){t.prevFromRect=t.fromRect,t.prevToRect=e}setupAnimationReset(t,e){t.animationResetTimer&&clearTimeout(t.animationResetTimer),t.animationResetTimer=window.setTimeout(()=>{t.animationTime=0,t.prevFromRect=null,t.fromRect=null,t.prevToRect=null,t.thisAnimationDuration=null,t.animationResetTimer=void 0},e),this.cleanupManager.registerTimer(this.instanceId,t.animationResetTimer),t.thisAnimationDuration=e}scheduleCallback(t,e,n){if(this.animationCallbackId&&clearTimeout(this.animationCallbackId),!t){n==null||n();return}this.animationCallbackId=window.setTimeout(()=>{n==null||n(),this.animationCallbackId=void 0},e),this.animationCallbackId&&this.cleanupManager.registerTimer(this.instanceId,this.animationCallbackId)}clearAnimation(t){clearTimeout(this.animationCallbackId),t==null||t()}destroy(){this.cleanupManager.cleanup(this.instanceId)}}function U(s){const e=[s.tagName||"",s.className||"",s.src||"",s.href||"",s.textContent||""].join("_");let n=0;for(let i=0;i<e.length;i++){const a=e.charCodeAt(i);n=(n<<5)-n+a,n=n&n}return Math.abs(n).toString(36)}function Z(s,t,e){const n=[],i=s.children;for(let a=0;a<i.length;a++){const r=i[a];w(r,t,s,!1)&&n.push(r.getAttribute(e)||U(r))}return n}const F=(s,t=!1)=>{let e;if(!s||!s.parentElement)return null;let n=s.parentElement;for(;n;){e=window.getComputedStyle(n);const i=e.overflow+e.overflowY+e.overflowX;if(/auto|scroll|overlay/.test(i)||t&&i.includes("hidden"))return n;n=n.parentElement}return document.scrollingElement||document.documentElement},_=s=>s===window?{scrollTop:window.pageYOffset||document.documentElement.scrollTop,scrollLeft:window.pageXOffset||document.documentElement.scrollLeft}:{scrollTop:s.scrollTop,scrollLeft:s.scrollLeft},I=class I{constructor(t,e){l(this,"state");l(this,"instanceId");l(this,"cleanupManager");l(this,"animationManager");l(this,"dragStartTimer");l(this,"normalizedGroup",null);l(this,"options");l(this,"el");l(this,"onMove",(t,e,n,i)=>{const a=this.options,r=a.swapThreshold||1,o=a.invertSwap||!1,d=a.invertedSwapThreshold||r,u=o?!1:r>.5,p=this.state.getDragOperation();if(n==="vertical"){const g=t.top+t.height/2,c=e.top+e.height/2;if(u?(g-c)/e.height>r:(c-g)/e.height>d)return this.dispatchMoveEvent(i,p.sourceEl,u)}else{const g=t.left+t.width/2,c=e.left+e.width/2;if(u?(g-c)/e.width>r:(c-g)/e.width>d)return this.dispatchMoveEvent(i,p.sourceEl,u)}return!1});l(this,"verifyDrag",t=>{if(!t.cancelable)return;const e=this.state.getEventTarget(t);if(!e)return;const n=w(e,this.getDraggableSelector(),this.el,!1);if(!n)return;const i=O(t);if(!i)return;const{clientX:a,clientY:r}=i;this.state.startDrag(n,a,r);const o=C(t);o&&this.state.updateDragPosition(o.clientX,o.clientY),this.initializeDragOperation(o,n)});l(this,"initDrag",()=>{const t=this.state.getDragOperation();if(!t.sourceEl)return;this.appendDraggingEl();const e=this.el.ownerDocument;this.options.supportPointer?this.cleanupManager.registerEventListener(this.instanceId,e,"pointermove",this.calculateDrag):(this.cleanupManager.registerEventListener(this.instanceId,e,"mousemove",this.calculateDrag),this.cleanupManager.registerEventListener(this.instanceId,e,"touchmove",this.calculateDrag)),this.cleanupManager.registerEventListener(this.instanceId,e,"dragover",this.onDragOver),this.state.updateDragElements({dragEl:t.sourceEl,oldIndex:Array.from(this.el.children).indexOf(t.sourceEl)}),this.dispatchSortEvent("dragstart")});l(this,"calculateDrag",t=>{const e=this.state.getDragOperation();if(!e.active||!t.cancelable)return;const n=O(t);if(!n)return;const{clientX:i,clientY:a}=n;if(this.state.updateDragPosition(i,a),e.dragEl){t.preventDefault(),this.emulateDragOver(t);const r=x(e.dragEl)||{e:0,f:0},o=i-e.position.clientX,d=a-e.position.clientY;e.dragEl.style.transform=`translate3d(${o+(r.e||0)}px,${d+(r.f||0)}px,0)`}else if(!e.moved){const r=this.options.touchStartThreshold||1;Math.max(Math.abs(i-e.position.clientX),Math.abs(a-e.position.clientY))>=r&&(this.state.updateDragElements({moved:!0}),this.initDrag())}});l(this,"onDragOver",t=>{var k,X;const e=this.state.getDragOperation();if(!e.active||!e.sourceEl)return;t.preventDefault(),t.stopPropagation();let n,i;if(this.isTouchEvent(t)){const v=t.touches[0];if(!v)return;n=v.clientX,i=v.clientY}else this.isDragEvent(t),n=t.clientX,i=t.clientY;const a=document.elementFromPoint(n,i);if(!a)return;const r=w(a,this.getDraggableSelector(),this.el,!1);if(!r||r===e.sourceEl)return;const o=f(r),d=this.getDirection(t,r),u=r.previousElementSibling,p=r.nextElementSibling,g=o.top+o.height/2,c=o.left+o.width/2,m=d==="vertical",L=(m?i:n)<(m?g:c),B=L?u:p,H=f(e.sourceEl);if(this.onMove(H,o,d,B)){this.captureAnimationState(),L?(k=r.parentNode)==null||k.insertBefore(e.sourceEl,r):(X=r.parentNode)==null||X.insertBefore(e.sourceEl,r.nextSibling),this.addAnimationState({target:r,rect:f(r)}),this.state.updateDragPosition(n,i);const v=e.oldIndex??-1,Y=Array.from(this.el.children).indexOf(e.sourceEl);v!==Y&&this.dispatchSortEvent("sort",{oldIndex:v,newIndex:Y,dragEl:e.sourceEl,target:r}),this.options.animation&&this.animateAll()}});l(this,"onScroll",t=>{const e=this.state.getDragOperation();if(!e.active||!e.dragEl)return;const{scrollTop:n,scrollLeft:i}=t.target,a=x(e.dragEl)||{e:0,f:0},r=e.position.clientX-e.position.initialX,o=e.position.clientY-e.position.initialY;e.dragEl.style.transform=`translate3d(${r+(a.e||0)}px,${o+(a.f||0)}px,0)`,this.state.updateScrollPosition(n,i)});l(this,"emulateDragOver",t=>{const e=this.state.getDragOperation();if(!e.active||!e.dragEl)return;const n=O(t);if(!n)return;const{clientX:i,clientY:a}=n;this.toggleDraggingElVisibility(!1);const r=document.elementFromPoint(i,a);if(!r||!(r instanceof HTMLElement)){this.toggleDraggingElVisibility(!0);return}if(this.toggleDraggingElVisibility(!0),this.isOutsideThisEl(r)){const c=this.getSortableParent(r);if(c&&c!==this){c.handleDragOver(t);return}}const o=w(r,this.getDraggableSelector(),this.el,!1);if(!o||o===e.sourceEl)return;const d=f(e.dragEl),u=f(o),p=this.getDirection(t,o),g=this.getTargetSibling(o,p);this.onMove(d,u,p,g)&&(this.captureAnimationState(),this._animate(o),this.addAnimationState({target:o,rect:f(o)}))});l(this,"onDrop",t=>{t&&t.preventDefault();const e=this.state.getDragOperation();if(!e.active||!e.dragEl)return;e.dragEl.parentNode&&e.dragEl.parentNode.removeChild(e.dragEl);const n=this.options.draggingClass||"sortable-dragging",i=this.options.fallbackClass||"sortable-fallback";e.sourceEl&&(T(e.sourceEl,n,!1),T(e.sourceEl,i,!1)),this.dispatchSortEvent("drop"),this.state.endDrag()});l(this,"getSortableParent",t=>{let e=t;for(;e&&e!==document.body;){const n=this.state.getInstance(e);if(n)return n;e=e.parentElement}return null});if(!t||!t.nodeType||t.nodeType!==1)throw new Error("Sortable: `el` must be HTMLElement, not null or undefined");this.instanceId=Symbol("SortableInstance"),this.cleanupManager=S.getInstance(),this.el=t,this.options={...I.defaultOptions,...e},this.state=M.getInstance(),this.animationManager=new z(this),this.cleanupManager.registerAnimationCleanup(this.instanceId,()=>{this.animationManager.destroy()}),this.state.registerInstance(t,this),this.initializeEventListeners(),this.options.group&&this.prepareGroup()}initializeEventListeners(){const t=n=>{this.verifyDrag(n)};this.options.supportPointer?this.cleanupManager.registerEventListener(this.instanceId,this.el,"pointerdown",t):(this.cleanupManager.registerEventListener(this.instanceId,this.el,"mousedown",t),this.cleanupManager.registerEventListener(this.instanceId,this.el,"touchstart",t));const e=F(this.el);if(e&&e!==document.documentElement&&e!==document.scrollingElement){const n=i=>{this.onScroll(i)};this.cleanupManager.registerEventListener(this.instanceId,e,"scroll",n)}}dispatchMoveEvent(t,e,n){if(!t||!e)return!1;const i=new CustomEvent("sortable:move",{bubbles:!0,cancelable:!0,detail:{target:t,related:e,willInsertAfter:n}});return this.el.dispatchEvent(i),!i.defaultPrevented}initializeDragOperation(t,e){e.style.willChange="transform",this.bindDragListeners(!!t);const n=this.options.delay;this.shouldApplyDelay()?(this.dragStartTimer=window.setTimeout(()=>{this.initDrag(),this.dragStartTimer=void 0},n),this.cleanupManager.registerTimer(this.instanceId,this.dragStartTimer)):this.initDrag()}getTargetSibling(t,e){return e==="vertical"?t.nextElementSibling:t.previousElementSibling}toggleDraggingElVisibility(t){const e=this.state.getDragOperation();e.dragEl&&h(e.dragEl,"display",t?"":"none")}appendDraggingEl(){const t=this.state.getDragOperation();if(!t.sourceEl)return;const e=this.options.fallbackOnBody?document.body:this.el,n=F(this.el),i=(n&&n!==document.body)??!1,a=f(t.sourceEl,!0,this.options.fallbackOnBody,!0,e),r=this.createDragElement(t.sourceEl,a);this.positionDragElement(r,a,i,n),e.appendChild(r),this.state.updateDragElements({dragEl:r})}createDragElement(t,e){const n=t.cloneNode(!0),{draggingClass:i="sortable-dragging",fallbackClass:a="sortable-fallback"}=this.options;T(n,a,!0),T(n,i,!0);const r={position:"fixed",zIndex:"100000",pointerEvents:"none",width:`${e.width}px`,height:`${e.height}px`,boxSizing:"border-box",margin:"0",opacity:"0.8",transition:"",transform:""};return h(n,r),n}positionDragElement(t,e,n,i){if(!n){h(t,{top:`${e.top}px`,left:`${e.left}px`});return}const a=f(i),r=_(i);h(t,{position:"absolute",top:`${e.top-a.top+r.scrollTop}px`,left:`${e.left-a.left+r.scrollLeft}px`})}isTouchEvent(t){return"touches"in t}isDragEvent(t){return"dataTransfer"in t}shouldApplyDelay(){return!!(this.options.delay&&this.options.delay>0)}bindDragListeners(t){const e=this.el.ownerDocument;this.options.supportPointer?(this.cleanupManager.registerEventListener(this.instanceId,e,"pointermove",this.calculateDrag),this.cleanupManager.registerEventListener(this.instanceId,e,"pointerup",this.onDrop),this.cleanupManager.registerEventListener(this.instanceId,e,"pointercancel",this.onDrop)):(this.cleanupManager.registerEventListener(this.instanceId,e,t?"touchmove":"mousemove",this.calculateDrag),this.cleanupManager.registerEventListener(this.instanceId,e,t?"touchend":"mouseup",this.onDrop),t&&this.cleanupManager.registerEventListener(this.instanceId,e,"touchcancel",this.onDrop))}_animate(t){const e=this.state.getDragOperation();if(!e.sourceEl)return;const n=Array.from(this.el.children).indexOf(e.sourceEl),i=Array.from(this.el.children).indexOf(t);n!==i&&(this.el.insertBefore(e.sourceEl,t),this.dispatchSortEvent("sort",{oldIndex:n,newIndex:i,dragEl:e.sourceEl,target:t}))}dispatchSortEvent(t,e={}){const n=new CustomEvent(t,{bubbles:!0,cancelable:!0,detail:{...e,from:this.el}});this.el.dispatchEvent(n)}getDirection(t,e){const n=this.options.direction;return typeof n=="function"?n.call(this,t,e,this.state.getDragOperation().sourceEl):n||"vertical"}isOutsideThisEl(t){return!t||!this.el.contains(t)&&t!==this.el}destroy(){this.state.destroyInstance(this.instanceId)}option(t,e){return e===void 0?this.options[t]:(this.options[t]=e,t==="group"&&this.prepareGroup(),e)}toArray(){return Z(this.el,this.getDraggableSelector(),this.options.dataIdAttr||"data-id")}sort(t,e){const n={},i=this.el;this.toArray().forEach((a,r)=>{const o=i.children[r];w(o,this.getDraggableSelector(),i,!1)&&(n[a]=o)}),e&&this.captureAnimationState(),t.forEach(a=>{n[a]&&(i.removeChild(n[a]),i.appendChild(n[a]))}),e&&this.animateAll()}save(){var e;const t=this.options.store;(e=t==null?void 0:t.set)==null||e.call(t,this)}captureAnimationState(){this.animationManager.captureAnimationState()}addAnimationState(t){this.animationManager.addAnimationState(t)}removeAnimationState(t){this.animationManager.removeAnimationState(t)}animateAll(t){this.animationManager.animateAll(t)}animate(t,e,n,i){this.animationManager.animate(t,e,n,i)}handleDragOver(t){this.onDragOver(t)}getDraggableSelector(){return this.options.draggable}prepareGroup(){const t=this.options;t.group||(t.group={name:void 0,pull:!0,put:!0,revertClone:!1}),typeof t.group=="string"&&(t.group={name:t.group});const e=t.group;this.normalizedGroup={name:e.name??null,checkPull:(n,i,a,r)=>e.pull?typeof e.pull=="function"?e.pull(n,i,a,r):e.pull:!1,checkPut:(n,i,a,r)=>{if(!e.put)return!1;if(Array.isArray(e.put)){const o=i.normalizedGroup;return e.put.includes((o==null?void 0:o.name)??"")}return typeof e.put=="function"?e.put(n,i,a,r):!!e.put},revertClone:e.revertClone??!1},this.cleanupManager.registerCustomCleanup(this.instanceId,()=>{this.normalizedGroup=null})}};l(I,"defaultOptions",{group:null,sort:!0,disabled:!1,store:null,handle:null,draggable:">*",swapThreshold:1,invertSwap:!1,invertedSwapThreshold:null,removeCloneOnHide:!0,direction:"vertical",draggingClass:"sortable-dragging",chosenClass:"sortable-chosen",dragClass:"sortable-drag",ignore:"a, img",filter:null,preventOnFilter:!0,animation:0,easing:null,setData:function(t,e){t.setData("Text",e.textContent||"")},dropBubble:!1,dragoverBubble:!1,dataIdAttr:"data-id",delay:0,touchStartThreshold:1,forceFallback:!1,fallbackClass:"sortable-fallback",fallbackOnBody:!1,fallbackTolerance:0,fallbackOffset:{x:0,y:0},supportPointer:!0,emptyInsertThreshold:5});let A=I;exports.AnimationStateManager=z;exports.Sortable=A;exports.animate=N;exports.closest=w;exports.getRect=f;
