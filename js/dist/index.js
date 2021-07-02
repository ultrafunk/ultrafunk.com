import{A as K,B as D,G as V,a as p,c as x,e as q,g as f,h as U,i as v,j,l as R,m as F,n as w,o as L,p as $,q as E,y as I,z as O}from"./chunk-776PIORV.js";var y=p("term-rest"),d={termCache:{}};function N(e,t,n,s){t in d.termCache?s(d.termCache[t].tracks):(y.log(`fetchTracks() - termType: ${e} - termId: ${t} - maxItems: ${n}`),fetch(`/wp-json/wp/v2/tracks?${e}=${t}&per_page=${n}&_fields=link,artists,channels,meta`).then(r=>r.ok?r.json():(y.error(r),null)).then(r=>{d.termCache[t]={tracks:r},s(r)}).catch(r=>{y.warn(r),s(null)}))}function Y(e,t,n,s){if("channels"in d.termCache[t]&&"artists"in d.termCache[t])s("channels",d.termCache[t].channels),s("artists",d.termCache[t].artists);else{let r=[],i=[];e.forEach(o=>{r.push.apply(r,o.channels),i.push.apply(i,o.artists)}),i=i.filter(o=>o!==t),z("channels",t,[...new Set(r)],n,s),z("artists",t,[...new Set(i)],n,s)}}function z(e,t,n,s,r){n.length>0?(y.log(`fetchMetadata() - termType: ${e} - termIds: ${n.length>0?n:"Empty"} - maxItems: ${s}`),fetch(`/wp-json/wp/v2/${e}?include=${n.join(",")}&per_page=${s}&_fields=link,name`).then(i=>i.ok?i.json():(y.error(i),null)).then(i=>{d.termCache[t][e]=i,r(e,i)}).catch(i=>{y.warn(i),r(null)})):(d.termCache[t][e]=null,r(e,null))}function J(){d.termCache=JSON.parse(sessionStorage.getItem(f.UF_TERMLIST_CACHE)),d.termCache===null&&(d.termCache={})}function W(){sessionStorage.setItem(f.UF_TERMLIST_CACHE,JSON.stringify(d.termCache))}function G(){sessionStorage.removeItem(f.UF_TERMLIST_CACHE)}function X(){return Object.keys(d.termCache).length>0}var oe=p("termlist"),b={settings:{},listContainer:null};function Q(e){oe.log("init()"),b.settings=e,b.listContainer=document.getElementById("termlist-container"),b.listContainer.addEventListener("click",t=>{let n=t.target.closest("div.play-button");if(n!==null)return H(t,n.querySelector("a").href);let s=t.target.closest("div.shuffle-button");if(s!==null)return ce(t,s.querySelector("a").href);let r=t.target.closest("div.share-find-button");if(r!==null)return ue(r);if(t.target.closest("div.termlist-header")!==null)return ge(t);let o=t.target.closest("div.thumbnail");if(o!==null)return de(t,o);let l=t.target.closest("a");if(l!==null)return fe(t,l)}),le()}function Z(){if(X()){let e={pageUrl:window.location.href,scrollPos:Math.round(window.pageYOffset),openTermIds:[]};document.querySelectorAll(".termlist-entry").forEach(t=>{t.classList.contains("open")&&e.openTermIds.push(t.id)}),sessionStorage.setItem(f.UF_TERMLIST_STATE,JSON.stringify(e)),W()}}function le(){if(J(),performance.navigation.type!==performance.navigation.TYPE_RELOAD){let e=JSON.parse(sessionStorage.getItem(f.UF_TERMLIST_STATE));e!==null&&e.pageUrl===window.location.href?(history.scrollRestoration="manual",e.openTermIds.forEach(t=>document.getElementById(t).querySelector("div.termlist-header").click()),window.scroll({top:e.scrollPos,left:0,behavior:"auto"})):history.scrollRestoration="auto"}sessionStorage.removeItem(f.UF_TERMLIST_STATE),G()}function T(e){return b.settings.user.preferredPlayer===x.LIST?e.replace(/ultrafunk\.com\//,"ultrafunk.com/list/"):e}function H(e,t,n=null){e.preventDefault(),Z(),sessionStorage.setItem(f.UF_AUTOPLAY,JSON.stringify({autoplay:e.shiftKey===!1,trackId:n,position:0})),window.location.href=T(t)}function ce(e,t){v("UF_RESHUFFLE","true"),H(e,t)}function ue(e){let t=e.getAttribute("data-term-path"),n=e.getAttribute("data-term-name"),s=T(e.getAttribute("data-term-url"));D.show({title:`Share / Find ${t}`,string:n,url:s,verb:"Find"})}function de(e,t){let n=b.listContainer.getAttribute("data-term-type")==="channels"?"channel":"artist",s=t.getAttribute("data-term-slug"),r=t.getAttribute("data-term-uid");return r!==null?H(e,`/list/${n}/${s}/`,r):H(e,t.getAttribute("data-term-url"))}function fe(e,t){Z(),t.closest(".permalink")!==null&&(e.preventDefault(),window.location.href=T(t.href))}function ge(e){let t=e.target.closest("div.termlist-entry"),n=t.querySelector("div.expand-toggle span"),s=t.querySelector("div.termlist-body"),r=s.style.display.length!==0;E(t,r?"open":"closed",r?"closed":"open"),n.innerText=r?"expand_more":"expand_less",s.style.display=r?"":"flex",r||he(t,s)}function he(e,t){let n=b.listContainer.getAttribute("data-term-type"),s=parseInt(e.getAttribute("data-term-id")),r=e.getAttribute("data-term-slug"),i=n==="channels";N(n,s,i?10:50,o=>{let l=i?"Latest Tracks":"All Tracks",u=t.querySelector(".body-left");o!==null?pe(l,r,o,u):u.innerHTML="<b>Error!</b><br>Unable to fetch track data...",!i&&o!==null&&Y(o,s,50,(C,k)=>{l=C==="artists"?"Related Artists":"In Channels",u=C==="artists"?t.querySelector(".artists"):t.querySelector(".channels"),k!==null?ye(l,k,u):u.innerHTML=`<b>${l}</b><br>None found`})})}function me(e){return e.includes("youtube.com/")?V(e):{src:"/wp-content/themes/ultrafunk/inc/img/soundcloud_icon.png",class:"type-soundcloud"}}function pe(e,t,n,s){let r=`<b>${e}</b>`;n.forEach(i=>{let o=me(i.meta.track_source_data),l=o?.uid!==void 0?`data-term-uid="${o.uid}"`:"";r+=`
    <div class="track">
      <div class="thumbnail ${o.class}" data-term-url="${i.link}" data-term-slug="${t}" ${l} title="Play Track">
        <img src="${o.src}">
      </div>
      <div class="artist-title text-nowrap-ellipsis">
        <a href="${i.link}" title="Go to track"><span><b>${i.meta.track_artist}</b></span><br><span>${i.meta.track_title}</span></a>
      </div>
    </div>`}),s.innerHTML=r}function ye(e,t,n){let s=`<b>${e}</b><br>`;t.forEach(r=>s+=`<a href="${T(r.link)}">${r.name}</a>, `),n.innerHTML=s.slice(0,s.length-2)}var A=p("index"),h={settings:{}},a={siteHeader:null,introBanner:null,siteContent:null,siteContentSearch:null,fullscreenTarget:null};document.addEventListener("DOMContentLoaded",()=>{A.log("DOMContentLoaded"),ee(),be(),a.introBanner!==null&&Ce(),document.getElementById("termlist-container")!==null&&Q(h.settings),a.siteContentSearch!==null&&(a.siteContentSearch.focus(),a.siteContentSearch.setSelectionRange(9999,9999)),ke(),document.addEventListener("settingsUpdated",()=>{ee(),K(h.settings),v(f.UF_TRACKS_PER_PAGE,h.settings.user.tracksPerPage,60*60*24*365*5)}),document.addEventListener("fullscreenElement",e=>a.fullscreenTarget=e.fullscreenTarget),document.addEventListener("keydown",Se)});function ee(){A.log("readSettings()"),h.settings=j(f.UF_SITE_SETTINGS,q,!0),A.log(h.settings)}function be(){A.log("initIndex()"),a.siteHeader=document.getElementById("site-header"),a.introBanner=document.getElementById("intro-banner"),a.siteContent=document.getElementById("site-content"),a.siteContentSearch=document.querySelector("#site-content form input.search-field"),O(h.settings),_.init(),m.init(),S.addEventListener(),ve.addEventListener()}function Se(e){if(e.repeat===!1&&e.ctrlKey===!1&&e.altKey===!1)switch(e.key){case"Escape":m.isVisible()&&(e.preventDefault(),m.toggle());return}if(h.settings.user.keyboardShortcuts&&e.repeat===!1&&e.ctrlKey===!1&&e.altKey===!1)switch(e.key){case"c":case"C":P()&&(e.preventDefault(),m.toggle());break;case"L":P()&&te()&&(I.galleryLayout.toggle(e),S.trigger());break;case"s":case"S":P()&&Ee()&&(e.preventDefault(),_.toggle());break;case"T":P()&&te()&&I.siteTheme.toggle(e);break;case"ArrowLeft":e.shiftKey&&M()&&ne(navigationVars.prev);break;case"ArrowRight":e.shiftKey&&M()&&ne(navigationVars.next);break}}function P(){return _.isVisible()===!1&&a.siteContentSearch!==document.activeElement}function te(){return document.body.classList.contains("page-settings")===!1}function Ee(){return a.fullscreenTarget===null}function M(){return document.body.classList.contains("no-playback")}function ne(e){e!=null&&e.length>0&&(window.location.href=e)}function Ce(){U("localStorage")&&typeof bannerProperty!="undefined"&&bannerProperty!==null&&h.settings.priv.banners[bannerProperty]&&(a.introBanner.style.display="block",S.trigger(),F("#intro-banner .intro-banner-close-button","click",()=>{a.introBanner.style.display="",a.siteContent.style.marginTop="",h.settings.priv.banners[bannerProperty]=!1}))}function ke(){if(document.querySelector(".nav-bar-title .go-back-to")!==null){let e="";if(document.referrer.length===0)e="Previous Page";else{let t=new URL(decodeURIComponent(document.referrer));if(t.search.length!==0)e="Search Results";else if(t.pathname.length>1){let n=t.pathname.slice(-1)==="/"?1:0,s=t.pathname.slice(1,t.pathname.length-n).replace(/-/gi," ").split("/");s.forEach((r,i)=>e+=i+1<s.length?r+" / ":r)}}document.querySelectorAll("#site-navigation .nav-bar-title").forEach(t=>{t.querySelector(".go-back-title").textContent=e.length>0?e:"Ultrafunk (home)",t.querySelector(".go-back-to").style.opacity=1})}}var m=(()=>{let e=new ResizeObserver(o),t=null,n=null,s=!1;return{isVisible(){return s},scrolledTop(){t.style.display=""},init:r,toggle:i};function r(){t=document.querySelector("#site-navigation .nav-menu-outer"),n=document.getElementById("nav-menu-modal-overlay"),w(".nav-menu-toggle","click",i),n.addEventListener("click",i),n.addEventListener("transitionend",l),e.observe(t.querySelector(".menu-primary-menu-container"))}function i(){a.siteHeader.classList.contains("sticky-nav-up")?s?t.style.display="none":t.style.display="flex":a.siteHeader.classList.contains("sticky-nav-down")===!1&&a.siteHeader.classList.toggle("hide-nav-menu")}function o(u){s=u[0].contentRect.height!==0,s?(n.className="",n.classList.add("show"),a.siteHeader.classList.add("no-backdrop-blur"),setTimeout(()=>n.classList.add("fadein"),50)):(a.siteHeader.classList.remove("no-backdrop-blur"),n.classList.add("fadeout"))}function l(){s===!1&&(n.className="",t.style.display="")}})(),_=(()=>{let e=new Event("allowKeyboardShortcuts"),t=new Event("denyKeyboardShortcuts"),n=null,s=null,r=null,i=!1;return{isVisible(){return i},init:o,toggle:l,hide:u};function o(){n=document.getElementById("search-container"),s=n.querySelector(".search-field"),r=a.siteHeader.querySelector("div.site-branding-container"),w(".nav-search-toggle","click",l),w(".nav-search-toggle","mousedown",c=>c.preventDefault()),s.addEventListener("blur",u),s.addEventListener("keydown",c=>{c.key==="Escape"&&(c.stopPropagation(),u())})}function l(){C()?k():u()}function u(){i&&B(!1,e,"","search")}function C(){return n.style.display.length===0?!(a.siteHeader.offsetHeight===0||$(R.SITE_MAX_WIDTH_MOBILE)&&a.siteHeader.querySelector(".nav-bar-container-mobile-top").offsetHeight===0&&a.siteHeader.querySelector(".nav-bar-container-mobile-up").offsetHeight===0):!1}function k(){se(),B(!0,t,"flex","clear"),s.focus(),s.setSelectionRange(9999,9999)}function B(c,g,re,ie){i=c,document.dispatchEvent(g),n.style.display=re,document.querySelectorAll("div.nav-search-toggle span").forEach(ae=>ae.textContent=ie),i?document.getElementById("playback-controls").classList.add("hide"):document.getElementById("playback-controls").classList.remove("hide")}function se(){let c={};if($(R.SITE_MAX_WIDTH_MOBILE))r.offsetHeight!==0?c.top=r.offsetTop:c.top=a.siteHeader.querySelector(".nav-bar-container-mobile-up").offsetTop,c=new DOMRect(63,c.top+3,document.body.clientWidth-63,30);else if(r.offsetHeight!==0){let g=r.getBoundingClientRect();c=new DOMRect(g.left,g.top+10,g.right,g.height-20)}else{let g=a.siteHeader.querySelector(".nav-bar-container").getBoundingClientRect();c=new DOMRect(g.left+105,g.top+2,g.right-105,g.height-4)}n.style.left=`${c.left}px`,n.style.top=`${c.top}px`,n.style.width=`${c.width-c.left}px`,n.style.height=`${c.height}px`}})(),S=(()=>{let e=0;return{getHeaderHeight(){return e},addEventListener:t,trigger:n};function t(){n(),window.addEventListener("resize",n)}function n(){M()?e=L("--site-header-height-no-playback"):e=L("--site-header-height"),a.introBanner!==null&&a.introBanner.style.display.length!==0&&(a.introBanner.style.marginTop=`${e}px`,a.siteContent.style.marginTop=`${L("--site-content-margin-top")}px`)}})(),ve=(()=>{let e=0,t=!1;return{addEventListener:n};function n(){s(),window.addEventListener("scroll",s)}function s(){let l=window.pageYOffset,u=Math.round(S.getHeaderHeight()>150?S.getHeaderHeight()/2:S.getHeaderHeight()/3);l<1?r():l>u&&l>e?i():o(),_.hide(),e=l}function r(){a.siteHeader.classList.remove("sticky-nav-down","sticky-nav-up"),a.siteHeader.classList.add("hide-nav-menu"),m.scrolledTop()}function i(){t===!1&&(t=!0,E(a.siteHeader,"sticky-nav-up","sticky-nav-down"))}function o(){t===!0&&(t=!1,E(a.siteHeader,"sticky-nav-down","sticky-nav-up")),m.isVisible()&&m.toggle()}})();
//# sourceMappingURL=index.js.map
