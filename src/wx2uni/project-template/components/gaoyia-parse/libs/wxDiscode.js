// HTML 支持的数学符号
function strNumDiscode(str) {
str = str.replace(/&forall;|&#8704;|&#x2200;/g, '∀');
str = str.replace(/&part;|&#8706;|&#x2202;/g, '∂');
str = str.replace(/&exist;|&#8707;|&#x2203;/g, '∃');
str = str.replace(/&empty;|&#8709;|&#x2205;/g, '∅');
str = str.replace(/&nabla;|&#8711;|&#x2207;/g, '∇');
str = str.replace(/&isin;|&#8712;|&#x2208;/g, '∈');
str = str.replace(/&notin;|&#8713;|&#x2209;/g, '∉');
str = str.replace(/&ni;|&#8715;|&#x220b;/g, '∋');
str = str.replace(/&prod;|&#8719;|&#x220f;/g, '∏');
str = str.replace(/&sum;|&#8721;|&#x2211;/g, '∑');
str = str.replace(/&minus;|&#8722;|&#x2212;/g, '−');
str = str.replace(/&lowast;|&#8727;|&#x2217;/g, '∗');
str = str.replace(/&radic;|&#8730;|&#x221a;/g, '√');
str = str.replace(/&prop;|&#8733;|&#x221d;/g, '∝');
str = str.replace(/&infin;|&#8734;|&#x221e;/g, '∞');
str = str.replace(/&ang;|&#8736;|&#x2220;/g, '∠');
str = str.replace(/&and;|&#8743;|&#x2227;/g, '∧');
str = str.replace(/&or;|&#8744;|&#x2228;/g, '∨');
str = str.replace(/&cap;|&#8745;|&#x2229;/g, '∩');
str = str.replace(/&cup;|&#8746;|&#x222a;/g, '∪');
str = str.replace(/&int;|&#8747;|&#x222b;/g, '∫');
str = str.replace(/&there4;|&#8756;|&#x2234;/g, '∴');
str = str.replace(/&sim;|&#8764;|&#x223c;/g, '∼');
str = str.replace(/&cong;|&#8773;|&#x2245;/g, '≅');
str = str.replace(/&asymp;|&#8776;|&#x2248;/g, '≈');
str = str.replace(/&ne;|&#8800;|&#x2260;/g, '≠');
str = str.replace(/&le;|&#8804;|&#x2264;/g, '≤');
str = str.replace(/&ge;|&#8805;|&#x2265;/g, '≥');
str = str.replace(/&sub;|&#8834;|&#x2282;/g, '⊂');
str = str.replace(/&sup;|&#8835;|&#x2283;/g, '⊃');
str = str.replace(/&nsub;|&#8836;|&#x2284;/g, '⊄');
str = str.replace(/&sube;|&#8838;|&#x2286;/g, '⊆');
str = str.replace(/&supe;|&#8839;|&#x2287;/g, '⊇');
str = str.replace(/&oplus;|&#8853;|&#x2295;/g, '⊕');
str = str.replace(/&otimes;|&#8855;|&#x2297;/g, '⊗');
str = str.replace(/&perp;|&#8869;|&#x22a5;/g, '⊥');
str = str.replace(/&sdot;|&#8901;|&#x22c5;/g, '⋅');
return str;
}

// HTML 支持的希腊字母
function strGreeceDiscode(str) {
str = str.replace(/&Alpha;|&#913;|&#x391;/g, 'Α');
str = str.replace(/&Beta;|&#914;|&#x392;/g, 'Β');
str = str.replace(/&Gamma;|&#915;|&#x393;/g, 'Γ');
str = str.replace(/&Delta;|&#916;|&#x394;/g, 'Δ');
str = str.replace(/&Epsilon;|&#917;|&#x395;/g, 'Ε');
str = str.replace(/&Zeta;|&#918;|&#x396;/g, 'Ζ');
str = str.replace(/&Eta;|&#919;|&#x397;/g, 'Η');
str = str.replace(/&Theta;|&#920;|&#x398;/g, 'Θ');
str = str.replace(/&Iota;|&#921;|&#x399;/g, 'Ι');
str = str.replace(/&Kappa;|&#922;|&#x39a;/g, 'Κ');
str = str.replace(/&Lambda;|&#923;|&#x39b;/g, 'Λ');
str = str.replace(/&Mu;|&#924;|&#x39c;/g, 'Μ');
str = str.replace(/&Nu;|&#925;|&#x39d;/g, 'Ν');
str = str.replace(/&Xi;|&#925;|&#x39d;/g, 'Ν');
str = str.replace(/&Omicron;|&#927;|&#x39f;/g, 'Ο');
str = str.replace(/&Pi;|&#928;|&#x3a0;/g, 'Π');
str = str.replace(/&Rho;|&#929;|&#x3a1;/g, 'Ρ');
str = str.replace(/&Sigma;|&#931;|&#x3a3;/g, 'Σ');
str = str.replace(/&Tau;|&#932;|&#x3a4;/g, 'Τ');
str = str.replace(/&Upsilon;|&#933;|&#x3a5;/g, 'Υ');
str = str.replace(/&Phi;|&#934;|&#x3a6;/g, 'Φ');
str = str.replace(/&Chi;|&#935;|&#x3a7;/g, 'Χ');
str = str.replace(/&Psi;|&#936;|&#x3a8;/g, 'Ψ');
str = str.replace(/&Omega;|&#937;|&#x3a9;/g, 'Ω');

str = str.replace(/&alpha;|&#945;|&#x3b1;/g, 'α');
str = str.replace(/&beta;|&#946;|&#x3b2;/g, 'β');
str = str.replace(/&gamma;|&#947;|&#x3b3;/g, 'γ');
str = str.replace(/&delta;|&#948;|&#x3b4;/g, 'δ');
str = str.replace(/&epsilon;|&#949;|&#x3b5;/g, 'ε');
str = str.replace(/&zeta;|&#950;|&#x3b6;/g, 'ζ');
str = str.replace(/&eta;|&#951;|&#x3b7;/g, 'η');
str = str.replace(/&theta;|&#952;|&#x3b8;/g, 'θ');
str = str.replace(/&iota;|&#953;|&#x3b9;/g, 'ι');
str = str.replace(/&kappa;|&#954;|&#x3ba;/g, 'κ');
str = str.replace(/&lambda;|&#955;|&#x3bb;/g, 'λ');
str = str.replace(/&mu;|&#956;|&#x3bc;/g, 'μ');
str = str.replace(/&nu;|&#957;|&#x3bd;/g, 'ν');
str = str.replace(/&xi;|&#958;|&#x3be;/g, 'ξ');
str = str.replace(/&omicron;|&#959;|&#x3bf;/g, 'ο');
str = str.replace(/&pi;|&#960;|&#x3c0;/g, 'π');
str = str.replace(/&rho;|&#961;|&#x3c1;/g, 'ρ');
str = str.replace(/&sigmaf;|&#962;|&#x3c2;/g, 'ς');
str = str.replace(/&sigma;|&#963;|&#x3c3;/g, 'σ');
str = str.replace(/&tau;|&#964;|&#x3c4;/g, 'τ');
str = str.replace(/&upsilon;|&#965;|&#x3c5;/g, 'υ');
str = str.replace(/&phi;|&#966;|&#x3c6;/g, 'φ');
str = str.replace(/&chi;|&#967;|&#x3c7;/g, 'χ');
str = str.replace(/&psi;|&#968;|&#x3c8;/g, 'ψ');
str = str.replace(/&omega;|&#969;|&#x3c9;/g, 'ω');
str = str.replace(/&thetasym;|&#977;|&#x3d1;/g, 'ϑ');
str = str.replace(/&upsih;|&#978;|&#x3d2;/g, 'ϒ');
str = str.replace(/&piv;|&#982;|&#x3d6;/g, 'ϖ');
str = str.replace(/&middot;|&#183;|&#xb7;/g, '·');
return str;
}

function strcharacterDiscode(str) {
// 加入常用解析

// str = str.replace(/&nbsp;|&#32;|&#x20;/g, "&nbsp;");
// str = str.replace(/&ensp;|&#8194;|&#x2002;/g, '&ensp;');
// str = str.replace(/&#12288;|&#x3000;/g, '<span class=\'spaceshow\'>　</span>');
// str = str.replace(/&emsp;|&#8195;|&#x2003;/g, '&emsp;');
// str = str.replace(/&quot;|&#34;|&#x22;/g, "\"");
// str = str.replace(/&apos;|&#39;|&#x27;/g, "&apos;");
// str = str.replace(/&acute;|&#180;|&#xB4;/g, "´");
// str = str.replace(/&times;|&#215;|&#xD7;/g, "×");
// str = str.replace(/&divide;|&#247;|&#xF7;/g, "÷");
// str = str.replace(/&amp;|&#38;|&#x26;/g, '&amp;');
// str = str.replace(/&lt;|&#60;|&#x3c;/g, '&lt;');
// str = str.replace(/&gt;|&#62;|&#x3e;/g, '&gt;');




str = str.replace(/&nbsp;|&#32;|&#x20;/g, "<span class='spaceshow'> </span>");
str = str.replace(/&ensp;|&#8194;|&#x2002;/g, '<span class=\'spaceshow\'> </span>');
str = str.replace(/&#12288;|&#x3000;/g, '<span class=\'spaceshow\'>　</span>');
str = str.replace(/&emsp;|&#8195;|&#x2003;/g, '<span class=\'spaceshow\'> </span>');
str = str.replace(/&quot;|&#34;|&#x22;/g, "\"");
str = str.replace(/&quot;|&#39;|&#x27;/g, "'");
str = str.replace(/&acute;|&#180;|&#xB4;/g, "´");
str = str.replace(/&times;|&#215;|&#xD7;/g, "×");
str = str.replace(/&divide;|&#247;|&#xF7;/g, "÷");
str = str.replace(/&amp;|&#38;|&#x26;/g, '&');
str = str.replace(/&lt;|&#60;|&#x3c;/g, '<');
str = str.replace(/&gt;|&#62;|&#x3e;/g, '>');
return str;
}

// HTML 支持的其他实体
function strOtherDiscode(str) {
str = str.replace(/&OElig;|&#338;|&#x152;/g, 'Œ');
str = str.replace(/&oelig;|&#339;|&#x153;/g, 'œ');
str = str.replace(/&Scaron;|&#352;|&#x160;/g, 'Š');
str = str.replace(/&scaron;|&#353;|&#x161;/g, 'š');
str = str.replace(/&Yuml;|&#376;|&#x178;/g, 'Ÿ');
str = str.replace(/&fnof;|&#402;|&#x192;/g, 'ƒ');
str = str.replace(/&circ;|&#710;|&#x2c6;/g, 'ˆ');
str = str.replace(/&tilde;|&#732;|&#x2dc;/g, '˜');
str = str.replace(/&thinsp;|$#8201;|&#x2009;/g, '<span class=\'spaceshow\'> </span>');
str = str.replace(/&zwnj;|&#8204;|&#x200C;/g, '<span class=\'spaceshow\'>‌</span>');
str = str.replace(/&zwj;|$#8205;|&#x200D;/g, '<span class=\'spaceshow\'>‍</span>');
str = str.replace(/&lrm;|$#8206;|&#x200E;/g, '<span class=\'spaceshow\'>‎</span>');
str = str.replace(/&rlm;|&#8207;|&#x200F;/g, '<span class=\'spaceshow\'>‏</span>');
str = str.replace(/&ndash;|&#8211;|&#x2013;/g, '–');
str = str.replace(/&mdash;|&#8212;|&#x2014;/g, '—');
str = str.replace(/&lsquo;|&#8216;|&#x2018;/g, '‘');
str = str.replace(/&rsquo;|&#8217;|&#x2019;/g, '’');
str = str.replace(/&sbquo;|&#8218;|&#x201a;/g, '‚');
str = str.replace(/&ldquo;|&#8220;|&#x201c;/g, '“');
str = str.replace(/&rdquo;|&#8221;|&#x201d;/g, '”');
str = str.replace(/&bdquo;|&#8222;|&#x201e;/g, '„');
str = str.replace(/&dagger;|&#8224;|&#x2020;/g, '†');
str = str.replace(/&Dagger;|&#8225;|&#x2021;/g, '‡');
str = str.replace(/&bull;|&#8226;|&#x2022;/g, '•');
str = str.replace(/&hellip;|&#8230;|&#x2026;/g, '…');
str = str.replace(/&permil;|&#8240;|&#x2030;/g, '‰');
str = str.replace(/&prime;|&#8242;|&#x2032;/g, '′');
str = str.replace(/&Prime;|&#8243;|&#x2033;/g, '″');
str = str.replace(/&lsaquo;|&#8249;|&#x2039;/g, '‹');
str = str.replace(/&rsaquo;|&#8250;|&#x203a;/g, '›');
str = str.replace(/&oline;|&#8254;|&#x203e;/g, '‾');
str = str.replace(/&euro;|&#8364;|&#x20ac;/g, '€');
str = str.replace(/&trade;|&#8482;|&#x2122;/g, '™');
str = str.replace(/&larr;|&#8592;|&#x2190;/g, '←');
str = str.replace(/&uarr;|&#8593;|&#x2191;/g, '↑');
str = str.replace(/&rarr;|&#8594;|&#x2192;/g, '→');
str = str.replace(/&darr;|&#8595;|&#x2193;/g, '↓');
str = str.replace(/&harr;|&#8596;|&#x2194;/g, '↔');
str = str.replace(/&crarr;|&#8629;|&#x21b5;/g, '↵');
str = str.replace(/&lceil;|&#8968;|&#x2308;/g, '⌈');
str = str.replace(/&rceil;|&#8969;|&#x2309;/g, '⌉');
str = str.replace(/&lfloor;|&#8970;|&#x230a;/g, '⌊');
str = str.replace(/&rfloor;|&#8971;|&#x230b;/g, '⌋');
str = str.replace(/&loz;|&#9674;|&#x25ca;/g, '◊');
str = str.replace(/&spades;|&#9824;|&#x2660;/g, '♠');
str = str.replace(/&clubs;|&#9827;|&#x2663;/g, '♣');
str = str.replace(/&hearts;|&#9829;|&#x2665;/g, '♥');
str = str.replace(/&diams;|&#9830;|&#x2666;/g, '♦');
return str;
}

function strDiscode(str) {
  str = strNumDiscode(str);
  str = strGreeceDiscode(str);
  str = strcharacterDiscode(str);
  str = strOtherDiscode(str);
  return str;
}

function urlToHttpUrl(url, domain) {
  if (/^\/\//.test(url)) {
    return `https:${url}`;
  } else if (/^\//.test(url)) {
    return `https://${domain}${url}`;
  }
  return url;
}

export default {
  strDiscode,
  urlToHttpUrl,
};
