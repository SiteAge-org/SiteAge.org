import { WEB_BASE_URL, BADGE_BASE_URL } from "@siteage/shared";

/**
 * Generates the widget.js script content.
 * The script reads data-* attributes from its own <script> tag and renders a badge.
 */
export function generateWidgetScript(badgeBaseUrl?: string, webBaseUrl?: string): string {
  const badge = badgeBaseUrl || BADGE_BASE_URL;
  const web = webBaseUrl || WEB_BASE_URL;

  return `(function(){
  var s=document.currentScript;
  if(!s)return;
  var d=s.getAttribute("data-domain");
  if(!d)return;
  var p=[];
  var st=s.getAttribute("data-style");
  if(st)p.push("style="+encodeURIComponent(st));
  var t=s.getAttribute("data-type");
  if(t)p.push("type="+encodeURIComponent(t));
  var f=s.getAttribute("data-format");
  if(f)p.push("format="+encodeURIComponent(f));
  var qs=p.length?"?"+p.join("&"):"";
  var a=document.createElement("a");
  a.href="${web}/"+encodeURIComponent(d);
  a.target="_blank";
  a.rel="noopener noreferrer";
  a.style.display="inline-block";
  var img=document.createElement("img");
  img.src="${badge}/"+encodeURIComponent(d)+qs;
  img.alt="SiteAge badge for "+d;
  img.style.height="20px";
  img.style.border="none";
  a.appendChild(img);
  s.parentNode.insertBefore(a,s);
})();`;
}
