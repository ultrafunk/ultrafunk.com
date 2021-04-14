import{E as W,F as G,a as v,d as pe,f,g as le,h as ue,i as ce,k as q,l as de,m as H,n as M,o as j,p as E,v as fe,w as he,x as me,y as ge,z as J}from"./chunk-TIFGV4JJ.js";var p=v("term-rest"),u={};function $(e,t,n,s){t in u?s(u[t].posts):(p.log(`fetchPosts() - termType: ${e} - termId: ${t} - maxItems: ${n}`),fetch(`/wp-json/wp/v2/posts?${e}=${t}&per_page=${n}&_fields=title,link,content,tags,categories`).then(r=>r.ok?r.json():(p.error(r),null)).then(r=>{u[t]={posts:r},s(r)}).catch(r=>{p.warn(r),s(null)}))}function I(e,t,n,s){if("categories"in u[t]&&"tags"in u[t])s("categories",u[t].categories),s("tags",u[t].tags);else{let r=[],i=[];e.forEach(o=>{r.push.apply(r,o.categories),i.push.apply(i,o.tags)}),i=i.filter(o=>o!==t),R("categories",t,[...new Set(r)],n,s),R("tags",t,[...new Set(i)],n,s)}}function R(e,t,n,s,r){n.length>0?(p.log(`fetchMetadata() - termType: ${e} - termIds: ${n.length>0?n:"Empty"} - maxItems: ${s}`),fetch(`/wp-json/wp/v2/${e}?include=${n.join(",")}&per_page=${s}&_fields=link,name`).then(i=>i.ok?i.json():(p.error(i),null)).then(i=>{u[t][e]=i,r(e,i)}).catch(i=>{p.warn(i),r(null)})):(u[t][e]=null,r(e,null))}function P(){u=JSON.parse(sessionStorage.getItem(f.UF_TERMLIST_CACHE)),u===null&&(u={})}function _(){sessionStorage.setItem(f.UF_TERMLIST_CACHE,JSON.stringify(u))}function O(){sessionStorage.removeItem(f.UF_TERMLIST_CACHE)}function x(){return Object.keys(u).length>0}var X=v("termlist"),Q=/\s{1,}[–·-]\s{1,}|\s{1,}(&#8211;)\s{1,}/,Z=/(?<=src=").*?(?=[?"])/i,C=null;function U(){X.log("init()"),C=document.getElementById("termlist-container"),C.addEventListener("click",e=>{let t=e.target.closest("div.play-button");if(t!==null)return w(e,t.querySelector("a").href);let n=e.target.closest("div.shuffle-button");if(n!==null)return w(e,n.querySelector("a").href);let s=e.target.closest("div.share-find-button");if(s!==null)return te(s);if(e.target.closest("div.termlist-header")!==null)return re(e);let i=e.target.closest("div.thumbnail");if(i!==null)return ne(e,i);if(e.target.closest("a")!==null)return B()}),ee()}function B(){if(x()){let e={pageUrl:window.location.href,scrollPos:Math.round(window.pageYOffset),openTermIds:[]};document.querySelectorAll(".termlist-entry").forEach(t=>{t.classList.contains("open")&&e.openTermIds.push(t.id)}),sessionStorage.setItem(f.UF_TERMLIST_STATE,JSON.stringify(e)),_()}}function ee(){if(P(),performance.navigation.type!==performance.navigation.TYPE_RELOAD){let e=JSON.parse(sessionStorage.getItem(f.UF_TERMLIST_STATE));e!==null&&e.pageUrl===window.location.href?(history.scrollRestoration="manual",e.openTermIds.forEach(t=>document.getElementById(t).querySelector("div.termlist-header").click()),window.scroll({top:e.scrollPos,left:0,behavior:"auto"})):history.scrollRestoration="auto"}sessionStorage.removeItem(f.UF_TERMLIST_STATE),O()}function w(e,t,n=null){e.preventDefault(),B(),sessionStorage.setItem(f.UF_AUTOPLAY,JSON.stringify({autoplay:e.shiftKey===!1,trackId:n,position:0})),window.location.href=t}function te(e){let t=e.getAttribute("data-term-path"),n=e.getAttribute("data-term-name"),s=e.getAttribute("data-term-url");J.show({title:`Share / Find ${t}`,string:n,url:s,verb:"Find"})}function ne(e,t){let n=C.getAttribute("data-term-type")==="categories"?"channel":"artist",s=t.getAttribute("data-term-slug"),r=t.getAttribute("data-term-uid");return r!==null?w(e,`/list/${n}/${s}/`,r):w(e,t.getAttribute("data-term-url"))}function re(e){let t=e.target.closest("div.termlist-entry"),n=t.querySelector("div.expand-toggle span"),s=t.querySelector("div.termlist-body"),r=s.style.display.length!==0;E(t,r?"open":"closed",r?"closed":"open"),n.innerText=r?"expand_more":"expand_less",s.style.display=r?"":"flex",r||se(t,s)}function se(e,t){let n=C.getAttribute("data-term-type"),s=parseInt(e.getAttribute("data-term-id")),r=e.getAttribute("data-term-slug"),i=n==="categories";$(n,s,i?10:50,o=>{let l=i?"Latest Tracks":"All Tracks",d=t.querySelector(".body-left");o!==null?ie(l,r,o,d):d.innerHTML="<b>Error!</b><br>Unable to fetch track data...",!i&&o!==null&&I(o,s,50,(b,S)=>{l=b==="tags"?"Related Artists":"In Channels",d=b==="tags"?t.querySelector(".artists"):t.querySelector(".channels"),S!==null?ae(l,S,d):d.innerHTML=`<b>${l}</b><br>None found`})})}function oe(e){return e.includes('id="soundcloud-uid')?{src:"/wp-content/themes/ultrafunk/inc/img/soundcloud_icon.png",class:"type-soundcloud"}:G(e.match(Z))}function ie(e,t,n,s){let r={},i=`<b>${e}</b>`;n.forEach(o=>{W(o.title.rendered,r,Q);let l=oe(o.content.rendered),d=l?.uid!==void 0?`data-term-uid="${l.uid}"`:"";i+=`
    <div class="track">
      <div class="thumbnail ${l.class}" data-term-url="${o.link}" data-term-slug="${t}" ${d} title="Play Track">
        <img src="${l.src}">
      </div>
      <div class="artist-title text-nowrap-ellipsis">
        <a href="${o.link}" title="Go to track"><span><b>${r.artist}</b></span><br><span>${r.title}</span></a>
      </div>
    </div>`}),s.innerHTML=i}function ae(e,t,n){let s=`<b>${e}</b><br>`;t.forEach(r=>s+=`<a href="${r.link}">${r.name}</a>, `),n.innerHTML=s.slice(0,s.length-2)}var T=v("index"),h={},F={smoothScrolling:!1,settingsUpdatedEvent:"settingsUpdated",fullscreenElementEvent:"fullscreenElement"},a={siteHeader:null,introBanner:null,siteContent:null,siteContentSearch:null,fullscreenTarget:null};document.addEventListener("DOMContentLoaded",()=>{T.log("DOMContentLoaded"),K(),ye(),a.introBanner!==null&&ve(),document.getElementById("termlist-container")!==null&&U(),a.siteContentSearch!==null&&(a.siteContentSearch.focus(),a.siteContentSearch.setSelectionRange(9999,9999)),Se(),document.addEventListener(F.settingsUpdatedEvent,()=>{K(),he(h),ue(f.UF_TRACKS_PER_PAGE,h.user.tracksPerPage,60*60*24*365*5)}),document.addEventListener(F.fullscreenElementEvent,e=>a.fullscreenTarget=e.fullscreenTarget),document.addEventListener("keydown",be)});function K(){T.log("readSettings()"),h=ce(f.UF_SITE_SETTINGS,pe,!0),T.log(h)}function ye(){T.log("initIndex()"),a.siteHeader=document.getElementById("site-header"),a.introBanner=document.getElementById("intro-banner"),a.siteContent=document.getElementById("site-content"),a.siteContentSearch=document.querySelector("#site-content form input.search-field"),fe(h),L.init(),m.init(),y.addEventListener(),Ee.addEventListener()}function be(e){if(e.repeat===!1&&e.ctrlKey===!1&&e.altKey===!1)switch(e.key){case"Escape":m.isVisible()&&(e.preventDefault(),m.toggle());return}if(h.user.keyboardShortcuts&&e.repeat===!1&&e.ctrlKey===!1&&e.altKey===!1)switch(e.key){case"c":case"C":k()&&(e.preventDefault(),m.toggle());break;case"L":k()&&D()&&(ge.toggle(e),y.trigger());break;case"s":case"S":k()&&Ce()&&(e.preventDefault(),L.toggle());break;case"T":k()&&D()&&me.toggle(e);break;case"ArrowLeft":e.shiftKey&&A()&&V(navigationVars.prev);break;case"ArrowRight":e.shiftKey&&A()&&V(navigationVars.next);break}}function k(){return L.isVisible()===!1&&a.siteContentSearch!==document.activeElement}function D(){return document.body.classList.contains("page-settings")===!1}function Ce(){return a.fullscreenTarget===null}function A(){return document.body.classList.contains("no-playback")}function V(e){e!=null&&e.length>0&&(window.location.href=e)}function ve(){le("localStorage")&&typeof bannerProperty!="undefined"&&bannerProperty!==null&&h.priv.banners[bannerProperty]&&(a.introBanner.style.display="block",y.trigger(),de("#intro-banner .intro-banner-close-button","click",()=>{a.introBanner.style.display="",a.siteContent.style.marginTop="",h.priv.banners[bannerProperty]=!1}))}function Se(){if(document.querySelector(".nav-bar-title .go-back-to")!==null){let e="";if(document.referrer.length===0)e="Previous Page";else{let t=new URL(decodeURIComponent(document.referrer));if(t.search.length!==0)e="Search Results";else if(t.pathname.length>1){let n=t.pathname.slice(-1)==="/"?1:0,s=t.pathname.slice(1,t.pathname.length-n).replace(/-/gi," ").split("/");s.forEach((r,i)=>e+=i+1<s.length?r+" / ":r)}}document.querySelectorAll("#site-navigation .nav-bar-title").forEach(t=>{t.querySelector(".go-back-title").textContent=e.length>0?e:"Ultrafunk (home)",t.querySelector(".go-back-to").style.opacity=1})}}var m=(()=>{let e=new ResizeObserver(i),t={navMenu:null,modalOverlay:null},n=!1;return{isVisible(){return n},scrolledTop(){t.navMenu.style.display=""},init:s,toggle:r};function s(){t.navMenu=document.querySelector("#site-navigation .nav-menu-outer"),t.modalOverlay=document.getElementById("nav-menu-modal-overlay"),H(".nav-menu-toggle","click",r),t.modalOverlay.addEventListener("click",r),t.modalOverlay.addEventListener("transitionend",o),e.observe(t.navMenu.querySelector(".menu-primary-menu-container"))}function r(){a.siteHeader.classList.contains("sticky-nav-up")?n?t.navMenu.style.display="none":t.navMenu.style.display="flex":a.siteHeader.classList.contains("sticky-nav-down")===!1&&a.siteHeader.classList.toggle("hide-nav-menu")}function i(l){n=l[0].contentRect.height!==0,n?(t.modalOverlay.className="",t.modalOverlay.classList.add("show"),setTimeout(()=>t.modalOverlay.classList.add("fadein"),50)):t.modalOverlay.classList.add("fadeout")}function o(){n===!1&&(t.modalOverlay.className="",t.navMenu.style.display="")}})(),L=(()=>{let e=new Event("allowKeyboardShortcuts"),t=new Event("denyKeyboardShortcuts"),n={searchContainer:null,searchField:null,brandingContainer:null},s=!1;return{isVisible(){return s},init:r,toggle:i,hide:o};function r(){n.searchContainer=document.getElementById("search-container"),n.searchField=n.searchContainer.querySelector(".search-field"),n.brandingContainer=a.siteHeader.querySelector("div.site-branding-container"),H(".nav-search-toggle","click",i),H(".nav-search-toggle","mousedown",c=>c.preventDefault()),n.searchField.addEventListener("blur",o),n.searchField.addEventListener("keydown",c=>{c.key==="Escape"&&(c.stopPropagation(),o())})}function i(){l()?d():o()}function o(){s&&b(!1,e,"","search")}function l(){return n.searchContainer.style.display.length===0?!(a.siteHeader.offsetHeight===0||j(q.SITE_MAX_WIDTH_MOBILE)&&a.siteHeader.querySelector(".nav-bar-container-mobile-top").offsetHeight===0&&a.siteHeader.querySelector(".nav-bar-container-mobile-up").offsetHeight===0):!1}function d(){S(),b(!0,t,"flex","clear"),n.searchField.focus(),n.searchField.setSelectionRange(9999,9999)}function b(c,g,N,Y){s=c,document.dispatchEvent(g),n.searchContainer.style.display=N,document.querySelectorAll("div.nav-search-toggle i").forEach(z=>z.textContent=Y),s?document.getElementById("playback-controls").classList.add("hide"):document.getElementById("playback-controls").classList.remove("hide")}function S(){let c={};if(j(q.SITE_MAX_WIDTH_MOBILE))n.brandingContainer.offsetHeight!==0?c.top=n.brandingContainer.offsetTop:c.top=a.siteHeader.querySelector(".nav-bar-container-mobile-up").offsetTop,c=new DOMRect(63,c.top+3,document.body.clientWidth-63,30);else if(n.brandingContainer.offsetHeight!==0){let g=n.brandingContainer.getBoundingClientRect();c=new DOMRect(g.left,g.top+10,g.right,g.height-20)}else{let g=a.siteHeader.querySelector(".nav-bar-container").getBoundingClientRect();c=new DOMRect(g.left+105,g.top+2,g.right-105,g.height-4)}n.searchContainer.style.left=`${c.left}px`,n.searchContainer.style.top=`${c.top}px`,n.searchContainer.style.width=`${c.width-c.left}px`,n.searchContainer.style.height=`${c.height}px`}})(),y=(()=>{let e=0;return{getHeaderHeight(){return e},addEventListener:t,trigger:n};function t(){n(),window.addEventListener("resize",n)}function n(){A()?e=M("--site-header-height-no-playback"):e=M("--site-header-height"),a.introBanner!==null&&a.introBanner.style.display.length!==0&&(a.introBanner.style.marginTop=`${e}px`,a.siteContent.style.marginTop=`${M("--site-content-margin-top")}px`)}})(),Ee=(()=>{let e=0,t=!1;return{addEventListener:n};function n(){s(),window.addEventListener("scroll",s)}function s(){let l=window.pageYOffset,d=Math.round(y.getHeaderHeight()>150?y.getHeaderHeight()/2:y.getHeaderHeight()/3);l<1?r():l>d&&l>e?i():o(),L.hide(),e=l}function r(){a.siteHeader.classList.remove("sticky-nav-down","sticky-nav-up"),a.siteHeader.classList.add("hide-nav-menu"),m.scrolledTop()}function i(){t===!1&&(t=!0,E(a.siteHeader,"sticky-nav-up","sticky-nav-down"))}function o(){t===!0&&(t=!1,E(a.siteHeader,"sticky-nav-down","sticky-nav-up")),m.isVisible()&&m.toggle()}})();
//# sourceMappingURL=index.js.map
