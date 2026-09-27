// Núcleos de gas noble para construir configuraciones electrónicas completas
const CORE_HE = "1s2";
const CORE_NE = "1s2 2s2 2p6";
const CORE_AR = "1s2 2s2 2p6 3s2 3p6";
const CORE_KR = CORE_AR + " 3d10 4s2 4p6";
const CORE_XE = CORE_KR + " 4d10 5s2 5p6";
const CORE_RN = CORE_XE + " 4f14 5d10 6s2 6p6";

function cfg(core, extra){
  return extra ? (core + " " + extra).trim() : core.trim();
}

const CATEGORY_LABELS = {
  "alcalino": "Metal alcalino",
  "alcalinoterreo": "Metal alcalinotérreo",
  "transicion": "Metal de transición",
  "post-transicion": "Metal post-transición",
  "metaloide": "Metaloide",
  "no-metal": "No metal",
  "halogeno": "Halógeno",
  "noble": "Gas noble",
  "lantanido": "Lantánido",
  "actinido": "Actínido",
  "desconocido": "Propiedades desconocidas"
};

// n, s, name, weight, mass(isotopo de referencia), cat, row, col, cfg, en, den, mp, bp, phase, year, desc
const ELEMENTS = [
{n:1,s:"H",name:"Hidrógeno",w:1.008,m:1,cat:"no-metal",row:1,col:1,cfg:"1s1",en:2.20,den:0.00009,mp:13.99,bp:20.27,phase:"Gas",year:"1766",desc:"El elemento más abundante del universo; forma el 75% de su masa total."},
{n:2,s:"He",name:"Helio",w:4.0026,m:4,cat:"noble",row:1,col:18,cfg:"1s2",en:null,den:0.000179,mp:0.95,bp:4.22,phase:"Gas",year:"1868",desc:"Se descubrió primero en el espectro solar antes que en la Tierra."},
{n:3,s:"Li",name:"Litio",w:6.94,m:7,cat:"alcalino",row:2,col:1,cfg:cfg(CORE_HE,"2s1"),en:0.98,den:0.534,mp:453.65,bp:1603,phase:"Sólido",year:"1817",desc:"El metal sólido menos denso; clave en las baterías recargables modernas."},
{n:4,s:"Be",name:"Berilio",w:9.0122,m:9,cat:"alcalinoterreo",row:2,col:2,cfg:cfg(CORE_HE,"2s2"),en:1.57,den:1.85,mp:1560,bp:2742,phase:"Sólido",year:"1798",desc:"Muy rígido y ligero; se usa en aleaciones aeroespaciales y satélites."},
{n:5,s:"B",name:"Boro",w:10.81,m:11,cat:"metaloide",row:2,col:13,cfg:cfg(CORE_HE,"2s2 2p1"),en:2.04,den:2.34,mp:2349,bp:4200,phase:"Sólido",year:"1808",desc:"Esencial para el vidrio borosilicato resistente al choque térmico."},
{n:6,s:"C",name:"Carbono",w:12.011,m:12,cat:"no-metal",row:2,col:14,cfg:cfg(CORE_HE,"2s2 2p2"),en:2.55,den:2.267,mp:3823,bp:4098,phase:"Sólido",year:"Antigüedad",desc:"Base de toda la química orgánica y de la vida tal como la conocemos."},
{n:7,s:"N",name:"Nitrógeno",w:14.007,m:14,cat:"no-metal",row:2,col:15,cfg:cfg(CORE_HE,"2s2 2p3"),en:3.04,den:0.001251,mp:63.15,bp:77.36,phase:"Gas",year:"1772",desc:"Compone casi el 78% de la atmósfera terrestre en forma de N2."},
{n:8,s:"O",name:"Oxígeno",w:15.999,m:16,cat:"no-metal",row:2,col:16,cfg:cfg(CORE_HE,"2s2 2p4"),en:3.44,den:0.001429,mp:54.36,bp:90.19,phase:"Gas",year:"1774",desc:"Imprescindible para la respiración celular de casi todos los seres vivos."},
{n:9,s:"F",name:"Flúor",w:18.998,m:19,cat:"halogeno",row:2,col:17,cfg:cfg(CORE_HE,"2s2 2p5"),en:3.98,den:0.001696,mp:53.48,bp:85.03,phase:"Gas",year:"1886",desc:"El elemento más electronegativo de la tabla periódica."},
{n:10,s:"Ne",name:"Neón",w:20.180,m:20,cat:"noble",row:2,col:18,cfg:cfg(CORE_HE,"2s2 2p6"),en:null,den:0.0009,mp:24.56,bp:27.07,phase:"Gas",year:"1898",desc:"Produce el característico brillo rojo-anaranjado de los carteles de neón."},
{n:11,s:"Na",name:"Sodio",w:22.990,m:23,cat:"alcalino",row:3,col:1,cfg:cfg(CORE_NE,"3s1"),en:0.93,den:0.971,mp:370.87,bp:1156,phase:"Sólido",year:"1807",desc:"Reacciona violentamente con el agua; esencial en la sal común (NaCl)."},
{n:12,s:"Mg",name:"Magnesio",w:24.305,m:24,cat:"alcalinoterreo",row:3,col:2,cfg:cfg(CORE_NE,"3s2"),en:1.31,den:1.738,mp:923,bp:1363,phase:"Sólido",year:"1755",desc:"Arde con una llama blanca intensa; núcleo de la clorofila en las plantas."},
{n:13,s:"Al",name:"Aluminio",w:26.982,m:27,cat:"post-transicion",row:3,col:13,cfg:cfg(CORE_NE,"3s2 3p1"),en:1.61,den:2.70,mp:933.47,bp:2743,phase:"Sólido",year:"1825",desc:"El metal no ferroso más usado del mundo gracias a su ligereza."},
{n:14,s:"Si",name:"Silicio",w:28.085,m:28,cat:"metaloide",row:3,col:14,cfg:cfg(CORE_NE,"3s2 3p2"),en:1.90,den:2.33,mp:1687,bp:3538,phase:"Sólido",year:"1824",desc:"Base de toda la electrónica moderna y de los semiconductores."},
{n:15,s:"P",name:"Fósforo",w:30.974,m:31,cat:"no-metal",row:3,col:15,cfg:cfg(CORE_NE,"3s2 3p3"),en:2.19,den:1.82,mp:317.3,bp:550,phase:"Sólido",year:"1669",desc:"Componente esencial del ADN, ARN y del ATP energético celular."},
{n:16,s:"S",name:"Azufre",w:32.06,m:32,cat:"no-metal",row:3,col:16,cfg:cfg(CORE_NE,"3s2 3p4"),en:2.58,den:2.07,mp:388.36,bp:717.87,phase:"Sólido",year:"Antigüedad",desc:"Reconocible por su olor y color amarillo; clave en la vulcanización del caucho."},
{n:17,s:"Cl",name:"Cloro",w:35.45,m:35,cat:"halogeno",row:3,col:17,cfg:cfg(CORE_NE,"3s2 3p5"),en:3.16,den:0.003214,mp:171.6,bp:239.11,phase:"Gas",year:"1774",desc:"Gas tóxico verdoso usado ampliamente para desinfectar agua potable."},
{n:18,s:"Ar",name:"Argón",w:39.948,m:40,cat:"noble",row:3,col:18,cfg:cfg(CORE_NE,"3s2 3p6"),en:null,den:0.0017837,mp:83.8,bp:87.3,phase:"Gas",year:"1894",desc:"El gas noble más abundante en la atmósfera terrestre."},
{n:19,s:"K",name:"Potasio",w:39.098,m:39,cat:"alcalino",row:4,col:1,cfg:cfg(CORE_AR,"4s1"),en:0.82,den:0.862,mp:336.53,bp:1032,phase:"Sólido",year:"1807",desc:"Vital para la transmisión de impulsos nerviosos y la función muscular."},
{n:20,s:"Ca",name:"Calcio",w:40.078,m:40,cat:"alcalinoterreo",row:4,col:2,cfg:cfg(CORE_AR,"4s2"),en:1.00,den:1.54,mp:1115,bp:1757,phase:"Sólido",year:"1808",desc:"El mineral más abundante del cuerpo humano; forma huesos y dientes."},
{n:21,s:"Sc",name:"Escandio",w:44.956,m:45,cat:"transicion",row:4,col:3,cfg:cfg(CORE_AR,"3d1 4s2"),en:1.36,den:2.985,mp:1814,bp:3109,phase:"Sólido",year:"1879",desc:"Se usa en aleaciones ligeras de aluminio para equipos deportivos."},
{n:22,s:"Ti",name:"Titanio",w:47.867,m:48,cat:"transicion",row:4,col:4,cfg:cfg(CORE_AR,"3d2 4s2"),en:1.54,den:4.506,mp:1941,bp:3560,phase:"Sólido",year:"1791",desc:"Tan resistente como el acero pero un 45% más ligero; usado en implantes."},
{n:23,s:"V",name:"Vanadio",w:50.942,m:51,cat:"transicion",row:4,col:5,cfg:cfg(CORE_AR,"3d3 4s2"),en:1.63,den:6.0,mp:2183,bp:3680,phase:"Sólido",year:"1801",desc:"Fortalece el acero y forma parte de algunas enzimas biológicas."},
{n:24,s:"Cr",name:"Cromo",w:51.996,m:52,cat:"transicion",row:4,col:6,cfg:cfg(CORE_AR,"3d5 4s1"),en:1.66,den:7.15,mp:2180,bp:2944,phase:"Sólido",year:"1797",desc:"Da brillo y resistencia a la corrosión al acero inoxidable."},
{n:25,s:"Mn",name:"Manganeso",w:54.938,m:55,cat:"transicion",row:4,col:7,cfg:cfg(CORE_AR,"3d5 4s2"),en:1.55,den:7.21,mp:1519,bp:2334,phase:"Sólido",year:"1774",desc:"Fundamental en la producción de acero y en las baterías alcalinas."},
{n:26,s:"Fe",name:"Hierro",w:55.845,m:56,cat:"transicion",row:4,col:8,cfg:cfg(CORE_AR,"3d6 4s2"),en:1.83,den:7.874,mp:1811,bp:3134,phase:"Sólido",year:"Antigüedad",desc:"El metal más usado por la humanidad y núcleo principal del planeta Tierra."},
{n:27,s:"Co",name:"Cobalto",w:58.933,m:59,cat:"transicion",row:4,col:9,cfg:cfg(CORE_AR,"3d7 4s2"),en:1.88,den:8.90,mp:1768,bp:3200,phase:"Sólido",year:"1735",desc:"Componente clave de la vitamina B12 y de baterías de iones de litio."},
{n:28,s:"Ni",name:"Níquel",w:58.693,m:58,cat:"transicion",row:4,col:10,cfg:cfg(CORE_AR,"3d8 4s2"),en:1.91,den:8.908,mp:1728,bp:3186,phase:"Sólido",year:"1751",desc:"Resistente a la corrosión; muy usado en monedas y acero inoxidable."},
{n:29,s:"Cu",name:"Cobre",w:63.546,m:63,cat:"transicion",row:4,col:11,cfg:cfg(CORE_AR,"3d10 4s1"),en:1.90,den:8.96,mp:1357.77,bp:2835,phase:"Sólido",year:"Antigüedad",desc:"Excelente conductor eléctrico; usado desde la Edad del Cobre."},
{n:30,s:"Zn",name:"Zinc",w:65.38,m:64,cat:"transicion",row:4,col:12,cfg:cfg(CORE_AR,"3d10 4s2"),en:1.65,den:7.14,mp:692.68,bp:1180,phase:"Sólido",year:"1746",desc:"Protege el hierro de la corrosión mediante galvanizado."},
{n:31,s:"Ga",name:"Galio",w:69.723,m:69,cat:"post-transicion",row:4,col:13,cfg:cfg(CORE_AR,"3d10 4s2 4p1"),en:1.81,den:5.91,mp:302.91,bp:2673,phase:"Sólido",year:"1875",desc:"Se funde literalmente en la palma de la mano a temperatura corporal."},
{n:32,s:"Ge",name:"Germanio",w:72.630,m:74,cat:"metaloide",row:4,col:14,cfg:cfg(CORE_AR,"3d10 4s2 4p2"),en:2.01,den:5.323,mp:1211.4,bp:3106,phase:"Sólido",year:"1886",desc:"Semiconductor pionero, predecesor del silicio en la electrónica."},
{n:33,s:"As",name:"Arsénico",w:74.922,m:75,cat:"metaloide",row:4,col:15,cfg:cfg(CORE_AR,"3d10 4s2 4p3"),en:2.18,den:5.776,mp:1090,bp:887,phase:"Sólido",year:"Antigüedad",desc:"Notorio por su toxicidad, aunque también se usa en semiconductores."},
{n:34,s:"Se",name:"Selenio",w:78.971,m:80,cat:"no-metal",row:4,col:16,cfg:cfg(CORE_AR,"3d10 4s2 4p4"),en:2.55,den:4.809,mp:494,bp:958,phase:"Sólido",year:"1817",desc:"Su conductividad cambia con la luz; usado en células fotoeléctricas."},
{n:35,s:"Br",name:"Bromo",w:79.904,m:79,cat:"halogeno",row:4,col:17,cfg:cfg(CORE_AR,"3d10 4s2 4p5"),en:2.96,den:3.122,mp:265.8,bp:332,phase:"Líquido",year:"1826",desc:"Uno de los dos únicos elementos líquidos a temperatura ambiente."},
{n:36,s:"Kr",name:"Kriptón",w:83.798,m:84,cat:"noble",row:4,col:18,cfg:cfg(CORE_AR,"3d10 4s2 4p6"),en:3.00,den:0.003733,mp:115.79,bp:119.93,phase:"Gas",year:"1898",desc:"Usado en lámparas de alta intensidad y en algunos láseres."},
{n:37,s:"Rb",name:"Rubidio",w:85.468,m:85,cat:"alcalino",row:5,col:1,cfg:cfg(CORE_KR,"5s1"),en:0.82,den:1.532,mp:312.45,bp:961,phase:"Sólido",year:"1861",desc:"Extremadamente reactivo; se inflama espontáneamente en contacto con el aire."},
{n:38,s:"Sr",name:"Estroncio",w:87.62,m:88,cat:"alcalinoterreo",row:5,col:2,cfg:cfg(CORE_KR,"5s2"),en:0.95,den:2.64,mp:1050,bp:1650,phase:"Sólido",year:"1790",desc:"Sus sales producen el color rojo en los fuegos artificiales."},
{n:39,s:"Y",name:"Itrio",w:88.906,m:89,cat:"transicion",row:5,col:3,cfg:cfg(CORE_KR,"4d1 5s2"),en:1.22,den:4.472,mp:1799,bp:3203,phase:"Sólido",year:"1794",desc:"Usado en fósforos rojos de pantallas y en superconductores."},
{n:40,s:"Zr",name:"Circonio",w:91.224,m:90,cat:"transicion",row:5,col:4,cfg:cfg(CORE_KR,"4d2 5s2"),en:1.33,den:6.52,mp:2128,bp:4650,phase:"Sólido",year:"1789",desc:"Muy resistente a la corrosión; se usa en reactores nucleares."},
{n:41,s:"Nb",name:"Niobio",w:92.906,m:93,cat:"transicion",row:5,col:5,cfg:cfg(CORE_KR,"4d4 5s1"),en:1.6,den:8.57,mp:2750,bp:5017,phase:"Sólido",year:"1801",desc:"Componente clave de los imanes superconductores."},
{n:42,s:"Mo",name:"Molibdeno",w:95.95,m:98,cat:"transicion",row:5,col:6,cfg:cfg(CORE_KR,"4d5 5s1"),en:2.16,den:10.28,mp:2896,bp:4912,phase:"Sólido",year:"1781",desc:"Aumenta la resistencia y dureza de aceros de alta temperatura."},
{n:43,s:"Tc",name:"Tecnecio",w:97,m:98,cat:"transicion",row:5,col:7,cfg:cfg(CORE_KR,"4d5 5s2"),en:1.9,den:11.0,mp:2430,bp:4538,phase:"Sólido",year:"1937",desc:"El primer elemento sintetizado artificialmente por el ser humano."},
{n:44,s:"Ru",name:"Rutenio",w:101.07,m:102,cat:"transicion",row:5,col:8,cfg:cfg(CORE_KR,"4d7 5s1"),en:2.2,den:12.45,mp:2607,bp:4423,phase:"Sólido",year:"1844",desc:"Endurece las aleaciones de platino y paladio en joyería."},
{n:45,s:"Rh",name:"Rodio",w:102.91,m:103,cat:"transicion",row:5,col:9,cfg:cfg(CORE_KR,"4d8 5s1"),en:2.28,den:12.41,mp:2237,bp:3968,phase:"Sólido",year:"1803",desc:"Uno de los metales más reflectantes y caros; usado en catalizadores."},
{n:46,s:"Pd",name:"Paladio",w:106.42,m:106,cat:"transicion",row:5,col:10,cfg:cfg(CORE_KR,"4d10"),en:2.20,den:12.023,mp:1828.05,bp:3236,phase:"Sólido",year:"1803",desc:"Capaz de absorber hasta 900 veces su volumen en hidrógeno."},
{n:47,s:"Ag",name:"Plata",w:107.87,m:107,cat:"transicion",row:5,col:11,cfg:cfg(CORE_KR,"4d10 5s1"),en:1.93,den:10.49,mp:1234.93,bp:2435,phase:"Sólido",year:"Antigüedad",desc:"El mejor conductor eléctrico y térmico de todos los metales."},
{n:48,s:"Cd",name:"Cadmio",w:112.41,m:114,cat:"transicion",row:5,col:12,cfg:cfg(CORE_KR,"4d10 5s2"),en:1.69,den:8.65,mp:594.22,bp:1040,phase:"Sólido",year:"1817",desc:"Tóxico y usado tradicionalmente en baterías níquel-cadmio."},
{n:49,s:"In",name:"Indio",w:114.82,m:115,cat:"post-transicion",row:5,col:13,cfg:cfg(CORE_KR,"4d10 5s2 5p1"),en:1.78,den:7.31,mp:429.75,bp:2345,phase:"Sólido",year:"1863",desc:"Esencial en las pantallas táctiles como óxido de indio y estaño."},
{n:50,s:"Sn",name:"Estaño",w:118.71,m:120,cat:"post-transicion",row:5,col:14,cfg:cfg(CORE_KR,"4d10 5s2 5p2"),en:1.96,den:7.31,mp:505.08,bp:2875,phase:"Sólido",year:"Antigüedad",desc:"Aleado con cobre da lugar al bronce, usado desde hace milenios."},
{n:51,s:"Sb",name:"Antimonio",w:121.76,m:121,cat:"metaloide",row:5,col:15,cfg:cfg(CORE_KR,"4d10 5s2 5p3"),en:2.05,den:6.697,mp:903.78,bp:1860,phase:"Sólido",year:"Antigüedad",desc:"Usado desde la antigüedad como cosmético (kohl) y en aleaciones."},
{n:52,s:"Te",name:"Telurio",w:127.60,m:130,cat:"metaloide",row:5,col:16,cfg:cfg(CORE_KR,"4d10 5s2 5p4"),en:2.1,den:6.24,mp:722.66,bp:1261,phase:"Sólido",year:"1782",desc:"Confiere a las aleaciones de acero mayor facilidad de mecanizado."},
{n:53,s:"I",name:"Yodo",w:126.90,m:127,cat:"halogeno",row:5,col:17,cfg:cfg(CORE_KR,"4d10 5s2 5p5"),en:2.66,den:4.933,mp:386.85,bp:457.4,phase:"Sólido",year:"1811",desc:"Esencial para la tiroides; sublima directamente formando vapor violeta."},
{n:54,s:"Xe",name:"Xenón",w:131.29,m:132,cat:"noble",row:5,col:18,cfg:cfg(CORE_KR,"4d10 5s2 5p6"),en:2.6,den:0.0058971,mp:161.4,bp:165.05,phase:"Gas",year:"1898",desc:"Usado en faros de xenón y como propulsor en motores iónicos."},
{n:55,s:"Cs",name:"Cesio",w:132.91,m:133,cat:"alcalino",row:6,col:1,cfg:cfg(CORE_XE,"6s1"),en:0.79,den:1.93,mp:301.59,bp:944,phase:"Sólido",year:"1860",desc:"La base del reloj atómico que define la duración del segundo."},
{n:56,s:"Ba",name:"Bario",w:137.33,m:138,cat:"alcalinoterreo",row:6,col:2,cfg:cfg(CORE_XE,"6s2"),en:0.89,den:3.51,mp:1000,bp:2170,phase:"Sólido",year:"1808",desc:"El sulfato de bario se usa como contraste en radiografías digestivas."},
{n:57,s:"La",name:"Lantano",w:138.91,m:139,cat:"lantanido",row:6,col:3,cfg:cfg(CORE_XE,"5d1 6s2"),en:1.10,den:6.145,mp:1193,bp:3737,phase:"Sólido",year:"1839",desc:"Da nombre a toda la serie de los lantánidos o 'tierras raras'."},
{n:58,s:"Ce",name:"Cerio",w:140.12,m:140,cat:"lantanido",row:9,col:4,cfg:cfg(CORE_XE,"4f1 5d1 6s2"),en:1.12,den:6.77,mp:1068,bp:3716,phase:"Sólido",year:"1803",desc:"El lantánido más abundante; usado en piedras de mechero por su pirofia."},
{n:59,s:"Pr",name:"Praseodimio",w:140.91,m:141,cat:"lantanido",row:9,col:5,cfg:cfg(CORE_XE,"4f3 6s2"),en:1.13,den:6.77,mp:1208,bp:3403,phase:"Sólido",year:"1885",desc:"Da un color verde-amarillo intenso a los vidrios de soldadura."},
{n:60,s:"Nd",name:"Neodimio",w:144.24,m:142,cat:"lantanido",row:9,col:6,cfg:cfg(CORE_XE,"4f4 6s2"),en:1.14,den:7.01,mp:1297,bp:3347,phase:"Sólido",year:"1885",desc:"Componente de los imanes permanentes más potentes que existen."},
{n:61,s:"Pm",name:"Prometio",w:145,m:145,cat:"lantanido",row:9,col:7,cfg:cfg(CORE_XE,"4f5 6s2"),en:1.13,den:7.26,mp:1315,bp:3273,phase:"Sólido",year:"1945",desc:"Único lantánido sin isótopos estables; usado en luces luminiscentes."},
{n:62,s:"Sm",name:"Samario",w:150.36,m:152,cat:"lantanido",row:9,col:8,cfg:cfg(CORE_XE,"4f6 6s2"),en:1.17,den:7.52,mp:1345,bp:2067,phase:"Sólido",year:"1879",desc:"Forma con el cobalto imanes muy estables a altas temperaturas."},
{n:63,s:"Eu",name:"Europio",w:151.96,m:153,cat:"lantanido",row:9,col:9,cfg:cfg(CORE_XE,"4f7 6s2"),en:1.2,den:5.264,mp:1099,bp:1802,phase:"Sólido",year:"1901",desc:"Se usa como marcador fluorescente de seguridad en billetes de euro."},
{n:64,s:"Gd",name:"Gadolinio",w:157.25,m:158,cat:"lantanido",row:9,col:10,cfg:cfg(CORE_XE,"4f7 5d1 6s2"),en:1.2,den:7.90,mp:1585,bp:3546,phase:"Sólido",year:"1880",desc:"Agente de contraste habitual en las resonancias magnéticas."},
{n:65,s:"Tb",name:"Terbio",w:158.93,m:159,cat:"lantanido",row:9,col:11,cfg:cfg(CORE_XE,"4f9 6s2"),en:1.1,den:8.23,mp:1629,bp:3503,phase:"Sólido",year:"1843",desc:"Emite luz verde brillante, usado en pantallas y láseres de estado sólido."},
{n:66,s:"Dy",name:"Disprosio",w:162.50,m:164,cat:"lantanido",row:9,col:12,cfg:cfg(CORE_XE,"4f10 6s2"),en:1.22,den:8.54,mp:1680,bp:2840,phase:"Sólido",year:"1886",desc:"Mejora la resistencia al calor de los imanes de neodimio."},
{n:67,s:"Ho",name:"Holmio",w:164.93,m:165,cat:"lantanido",row:9,col:13,cfg:cfg(CORE_XE,"4f11 6s2"),en:1.23,den:8.79,mp:1734,bp:2993,phase:"Sólido",year:"1878",desc:"Posee el mayor momento magnético de todos los elementos naturales."},
{n:68,s:"Er",name:"Erbio",w:167.26,m:166,cat:"lantanido",row:9,col:14,cfg:cfg(CORE_XE,"4f12 6s2"),en:1.24,den:9.066,mp:1802,bp:3141,phase:"Sólido",year:"1843",desc:"Amplifica señales en las fibras ópticas de telecomunicaciones."},
{n:69,s:"Tm",name:"Tulio",w:168.93,m:169,cat:"lantanido",row:9,col:15,cfg:cfg(CORE_XE,"4f13 6s2"),en:1.25,den:9.32,mp:1818,bp:2223,phase:"Sólido",year:"1879",desc:"El lantánido más escaso y caro de obtener en forma pura."},
{n:70,s:"Yb",name:"Iterbio",w:173.05,m:174,cat:"lantanido",row:9,col:16,cfg:cfg(CORE_XE,"4f14 6s2"),en:1.1,den:6.90,mp:1097,bp:1469,phase:"Sólido",year:"1878",desc:"Usado como referencia en relojes atómicos ópticos de gran precisión."},
{n:71,s:"Lu",name:"Lutecio",w:174.97,m:175,cat:"lantanido",row:9,col:17,cfg:cfg(CORE_XE,"4f14 5d1 6s2"),en:1.27,den:9.84,mp:1925,bp:3675,phase:"Sólido",year:"1907",desc:"El lantánido más denso y duro; cierra la serie de las tierras raras."},
{n:72,s:"Hf",name:"Hafnio",w:178.49,m:180,cat:"transicion",row:6,col:4,cfg:cfg(CORE_XE,"4f14 5d2 6s2"),en:1.3,den:13.31,mp:2506,bp:4876,phase:"Sólido",year:"1923",desc:"Absorbe neutrones eficazmente; usado en barras de control nuclear."},
{n:73,s:"Ta",name:"Tántalo",w:180.95,m:181,cat:"transicion",row:6,col:5,cfg:cfg(CORE_XE,"4f14 5d3 6s2"),en:1.5,den:16.65,mp:3290,bp:5731,phase:"Sólido",year:"1802",desc:"Muy resistente a la corrosión; clave en condensadores electrónicos."},
{n:74,s:"W",name:"Wolframio",w:183.84,m:184,cat:"transicion",row:6,col:6,cfg:cfg(CORE_XE,"4f14 5d4 6s2"),en:2.36,den:19.25,mp:3695,bp:5828,phase:"Sólido",year:"1783",desc:"El metal con el punto de fusión más alto de todos los elementos."},
{n:75,s:"Re",name:"Renio",w:186.21,m:187,cat:"transicion",row:6,col:7,cfg:cfg(CORE_XE,"4f14 5d5 6s2"),en:1.9,den:21.02,mp:3459,bp:5869,phase:"Sólido",year:"1925",desc:"Uno de los elementos más raros de la corteza terrestre."},
{n:76,s:"Os",name:"Osmio",w:190.23,m:192,cat:"transicion",row:6,col:8,cfg:cfg(CORE_XE,"4f14 5d6 6s2"),en:2.2,den:22.59,mp:3306,bp:5285,phase:"Sólido",year:"1803",desc:"El elemento natural más denso conocido."},
{n:77,s:"Ir",name:"Iridio",w:192.22,m:193,cat:"transicion",row:6,col:9,cfg:cfg(CORE_XE,"4f14 5d7 6s2"),en:2.20,den:22.56,mp:2719,bp:4403,phase:"Sólido",year:"1803",desc:"Extremadamente resistente a la corrosión; usado en electrodos de bujía."},
{n:78,s:"Pt",name:"Platino",w:195.08,m:195,cat:"transicion",row:6,col:10,cfg:cfg(CORE_XE,"4f14 5d9 6s1"),en:2.28,den:21.45,mp:2041.4,bp:4098,phase:"Sólido",year:"1735",desc:"Muy valorado en joyería y como catalizador en convertidores catalíticos."},
{n:79,s:"Au",name:"Oro",w:196.97,m:197,cat:"transicion",row:6,col:11,cfg:cfg(CORE_XE,"4f14 5d10 6s1"),en:2.54,den:19.30,mp:1337.33,bp:3243,phase:"Sólido",year:"Antigüedad",desc:"Prácticamente inalterable al aire y usado como reserva de valor milenaria."},
{n:80,s:"Hg",name:"Mercurio",w:200.59,m:202,cat:"transicion",row:6,col:12,cfg:cfg(CORE_XE,"4f14 5d10 6s2"),en:2.00,den:13.534,mp:234.32,bp:629.88,phase:"Líquido",year:"Antigüedad",desc:"El único metal líquido a temperatura ambiente; muy tóxico."},
{n:81,s:"Tl",name:"Talio",w:204.38,m:205,cat:"post-transicion",row:6,col:13,cfg:cfg(CORE_XE,"4f14 5d10 6s2 6p1"),en:1.62,den:11.85,mp:577,bp:1746,phase:"Sólido",year:"1861",desc:"Altamente tóxico; históricamente usado como veneno para roedores."},
{n:82,s:"Pb",name:"Plomo",w:207.2,m:208,cat:"post-transicion",row:6,col:14,cfg:cfg(CORE_XE,"4f14 5d10 6s2 6p2"),en:2.33,den:11.34,mp:600.61,bp:2022,phase:"Sólido",year:"Antigüedad",desc:"Denso y blando, usado en baterías y como blindaje contra radiación."},
{n:83,s:"Bi",name:"Bismuto",w:208.98,m:209,cat:"post-transicion",row:6,col:15,cfg:cfg(CORE_XE,"4f14 5d10 6s2 6p3"),en:2.02,den:9.78,mp:544.7,bp:1837,phase:"Sólido",year:"Antigüedad",desc:"Forma cristales en espiral de colores iridiscentes muy llamativos."},
{n:84,s:"Po",name:"Polonio",w:209,m:209,cat:"post-transicion",row:6,col:16,cfg:cfg(CORE_XE,"4f14 5d10 6s2 6p4"),en:2.0,den:9.20,mp:527,bp:1235,phase:"Sólido",year:"1898",desc:"Descubierto por Marie Curie; extremadamente radiactivo y tóxico."},
{n:85,s:"At",name:"Astato",w:210,m:210,cat:"metaloide",row:6,col:17,cfg:cfg(CORE_XE,"4f14 5d10 6s2 6p5"),en:2.2,den:null,mp:575,bp:610,phase:"Sólido",year:"1940",desc:"Uno de los elementos más raros de la corteza terrestre, muy inestable."},
{n:86,s:"Rn",name:"Radón",w:222,m:222,cat:"noble",row:6,col:18,cfg:cfg(CORE_XE,"4f14 5d10 6s2 6p6"),en:null,den:0.00973,mp:202,bp:211.5,phase:"Gas",year:"1900",desc:"Gas radiactivo que puede acumularse en sótanos mal ventilados."},
{n:87,s:"Fr",name:"Francio",w:223,m:223,cat:"alcalino",row:7,col:1,cfg:cfg(CORE_RN,"7s1"),en:0.7,den:null,mp:300,bp:950,phase:"Sólido",year:"1939",desc:"Uno de los elementos naturales más inestables y raros que existen."},
{n:88,s:"Ra",name:"Radio",w:226,m:226,cat:"alcalinoterreo",row:7,col:2,cfg:cfg(CORE_RN,"7s2"),en:0.9,den:5.5,mp:973,bp:2010,phase:"Sólido",year:"1898",desc:"Brilla en la oscuridad; descubierto también por Marie y Pierre Curie."},
{n:89,s:"Ac",name:"Actinio",w:227,m:227,cat:"actinido",row:7,col:3,cfg:cfg(CORE_RN,"6d1 7s2"),en:1.1,den:10.07,mp:1500,bp:3500,phase:"Sólido",year:"1899",desc:"Da nombre a toda la serie de los actínidos; brilla en azul pálido."},
{n:90,s:"Th",name:"Torio",w:232.04,m:232,cat:"actinido",row:10,col:4,cfg:cfg(CORE_RN,"6d2 7s2"),en:1.3,den:11.72,mp:2023,bp:5061,phase:"Sólido",year:"1828",desc:"Posible combustible nuclear futuro, más abundante que el uranio."},
{n:91,s:"Pa",name:"Protactinio",w:231.04,m:231,cat:"actinido",row:10,col:5,cfg:cfg(CORE_RN,"5f2 6d1 7s2"),en:1.5,den:15.37,mp:1841,bp:4300,phase:"Sólido",year:"1913",desc:"Extremadamente raro, tóxico y radiactivo; muy costoso de aislar."},
{n:92,s:"U",name:"Uranio",w:238.03,m:238,cat:"actinido",row:10,col:6,cfg:cfg(CORE_RN,"5f3 6d1 7s2"),en:1.38,den:19.05,mp:1405.3,bp:4404,phase:"Sólido",year:"1789",desc:"Combustible clave de los reactores nucleares y armamento atómico."},
{n:93,s:"Np",name:"Neptunio",w:237,m:237,cat:"actinido",row:10,col:7,cfg:cfg(CORE_RN,"5f4 6d1 7s2"),en:1.36,den:20.45,mp:917,bp:4273,phase:"Sólido",year:"1940",desc:"El primer elemento transuránico sintetizado por el hombre."},
{n:94,s:"Pu",name:"Plutonio",w:244,m:244,cat:"actinido",row:10,col:8,cfg:cfg(CORE_RN,"5f6 7s2"),en:1.28,den:19.82,mp:912.5,bp:3505,phase:"Sólido",year:"1940",desc:"Combustible de armas nucleares y de sondas espaciales de larga duración."},
{n:95,s:"Am",name:"Americio",w:243,m:243,cat:"actinido",row:10,col:9,cfg:cfg(CORE_RN,"5f7 7s2"),en:1.3,den:12.0,mp:1449,bp:2880,phase:"Sólido",year:"1944",desc:"Presente en muchos detectores de humo domésticos."},
{n:96,s:"Cm",name:"Curio",w:247,m:247,cat:"actinido",row:10,col:10,cfg:cfg(CORE_RN,"5f7 6d1 7s2"),en:1.3,den:13.51,mp:1613,bp:3383,phase:"Sólido",year:"1944",desc:"Nombrado en honor a Marie y Pierre Curie; muy radiactivo."},
{n:97,s:"Bk",name:"Berkelio",w:247,m:247,cat:"actinido",row:10,col:11,cfg:cfg(CORE_RN,"5f9 7s2"),en:1.3,den:14.79,mp:1259,bp:null,phase:"Sólido",year:"1949",desc:"Sintetizado por primera vez en la Universidad de Berkeley."},
{n:98,s:"Cf",name:"Californio",w:251,m:251,cat:"actinido",row:10,col:12,cfg:cfg(CORE_RN,"5f10 7s2"),en:1.3,den:15.1,mp:1173,bp:null,phase:"Sólido",year:"1950",desc:"Fuente potente de neutrones usada en la industria y medicina."},
{n:99,s:"Es",name:"Einstenio",w:252,m:252,cat:"actinido",row:10,col:13,cfg:cfg(CORE_RN,"5f11 7s2"),en:1.3,den:null,mp:1133,bp:null,phase:"Sólido",year:"1952",desc:"Descubierto entre los restos de la primera prueba de bomba de hidrógeno."},
{n:100,s:"Fm",name:"Fermio",w:257,m:257,cat:"actinido",row:10,col:14,cfg:cfg(CORE_RN,"5f12 7s2"),en:1.3,den:null,mp:null,bp:null,phase:"Sólido",year:"1952",desc:"Nombrado en honor al físico Enrico Fermi; nunca se ha visto a simple vista."},
{n:101,s:"Md",name:"Mendelevio",w:258,m:258,cat:"actinido",row:10,col:15,cfg:cfg(CORE_RN,"5f13 7s2"),en:1.3,den:null,mp:null,bp:null,phase:"Sólido",year:"1955",desc:"Homenaje a Dmitri Mendeléyev, creador de la tabla periódica."},
{n:102,s:"No",name:"Nobelio",w:259,m:259,cat:"actinido",row:10,col:16,cfg:cfg(CORE_RN,"5f14 7s2"),en:1.3,den:null,mp:null,bp:null,phase:"Sólido",year:"1957",desc:"Nombrado en honor a Alfred Nobel; solo existe en cantidades atómicas."},
{n:103,s:"Lr",name:"Lawrencio",w:262,m:262,cat:"actinido",row:10,col:17,cfg:cfg(CORE_RN,"5f14 7s2 7p1"),en:null,den:null,mp:null,bp:null,phase:"Sólido",year:"1961",desc:"Cierra la serie de los actínidos; nombrado en honor a Ernest Lawrence."},
{n:104,s:"Rf",name:"Rutherfordio",w:267,m:267,cat:"transicion",row:7,col:4,cfg:cfg(CORE_RN,"5f14 6d2 7s2"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"1964",desc:"Primer elemento transactínido; nombrado por Ernest Rutherford."},
{n:105,s:"Db",name:"Dubnio",w:268,m:268,cat:"transicion",row:7,col:5,cfg:cfg(CORE_RN,"5f14 6d3 7s2"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"1967",desc:"Nombrado en honor a la ciudad rusa de Dubná, donde fue sintetizado."},
{n:106,s:"Sg",name:"Seaborgio",w:271,m:271,cat:"transicion",row:7,col:6,cfg:cfg(CORE_RN,"5f14 6d4 7s2"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"1974",desc:"Homenaje a Glenn Seaborg, descubridor de varios elementos transuránicos."},
{n:107,s:"Bh",name:"Bohrio",w:272,m:272,cat:"transicion",row:7,col:7,cfg:cfg(CORE_RN,"5f14 6d5 7s2"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"1981",desc:"Nombrado en honor al físico Niels Bohr."},
{n:108,s:"Hs",name:"Hasio",w:270,m:270,cat:"transicion",row:7,col:8,cfg:cfg(CORE_RN,"5f14 6d6 7s2"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"1984",desc:"Su nombre proviene de Hesse, el estado alemán donde se descubrió."},
{n:109,s:"Mt",name:"Meitnerio",w:278,m:278,cat:"transicion",row:7,col:9,cfg:cfg(CORE_RN,"5f14 6d7 7s2"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"1982",desc:"Nombrado en honor a la física Lise Meitner."},
{n:110,s:"Ds",name:"Darmstadtio",w:281,m:281,cat:"transicion",row:7,col:10,cfg:cfg(CORE_RN,"5f14 6d8 7s2"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"1994",desc:"Descubierto en Darmstadt, Alemania, sede del GSI."},
{n:111,s:"Rg",name:"Roentgenio",w:282,m:282,cat:"transicion",row:7,col:11,cfg:cfg(CORE_RN,"5f14 6d9 7s2"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"1994",desc:"Nombrado en honor a Wilhelm Röntgen, descubridor de los rayos X."},
{n:112,s:"Cn",name:"Copernicio",w:285,m:285,cat:"transicion",row:7,col:12,cfg:cfg(CORE_RN,"5f14 6d10 7s2"),en:null,den:null,mp:null,bp:283,phase:"Líquido (predicho)",year:"1996",desc:"Nombrado en honor a Nicolás Copérnico; podría ser líquido o gas a temp. ambiente."},
{n:113,s:"Nh",name:"Nihonio",w:286,m:286,cat:"post-transicion",row:7,col:13,cfg:cfg(CORE_RN,"5f14 6d10 7s2 7p1"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"2004",desc:"Primer elemento descubierto y nombrado por científicos japoneses (Nihon)."},
{n:114,s:"Fl",name:"Flerovio",w:289,m:289,cat:"post-transicion",row:7,col:14,cfg:cfg(CORE_RN,"5f14 6d10 7s2 7p2"),en:null,den:null,mp:null,bp:null,phase:"Líquido (predicho)",year:"1998",desc:"Nombrado en honor a Gueorgui Fliórov, físico nuclear soviético."},
{n:115,s:"Mc",name:"Moscovio",w:290,m:290,cat:"post-transicion",row:7,col:15,cfg:cfg(CORE_RN,"5f14 6d10 7s2 7p3"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"2003",desc:"Nombrado en honor a la región de Moscú, donde se sintetizó."},
{n:116,s:"Lv",name:"Livermorio",w:293,m:293,cat:"post-transicion",row:7,col:16,cfg:cfg(CORE_RN,"5f14 6d10 7s2 7p4"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"2000",desc:"Nombrado por el Laboratorio Lawrence Livermore, en California."},
{n:117,s:"Ts",name:"Teneso",w:294,m:294,cat:"halogeno",row:7,col:17,cfg:cfg(CORE_RN,"5f14 6d10 7s2 7p5"),en:null,den:null,mp:null,bp:null,phase:"Sólido (predicho)",year:"2010",desc:"Nombrado en honor al estado de Tennessee, EE.UU."},
{n:118,s:"Og",name:"Oganesón",w:294,m:294,cat:"noble",row:7,col:18,cfg:cfg(CORE_RN,"5f14 6d10 7s2 7p6"),en:null,den:null,mp:null,bp:null,phase:"Gas (predicho)",year:"2002",desc:"El elemento más pesado sintetizado hasta la fecha; nombrado por Yuri Oganessian."}
];

// Índice rápido por número atómico y por símbolo
const ELEMENTS_BY_NUMBER = {};
const ELEMENTS_BY_SYMBOL = {};
ELEMENTS.forEach(el => {
  ELEMENTS_BY_NUMBER[el.n] = el;
  ELEMENTS_BY_SYMBOL[el.s.toLowerCase()] = el;
});

const SHELL_LETTERS = ["K", "L", "M", "N", "O", "P", "Q"];

// Obtener bloque orbital (s, p, d, f)
function getBlock(el){
  if(el.n === 2) return "s"; // Helio es 1s2
  if(el.cat === "lantanido" || el.cat === "actinido" || el.row >= 9) return "f";
  if(el.col <= 2) return "s";
  if(el.col >= 13) return "p";
  return "d";
}

// Obtener fase normalizada para filtros ('solido', 'liquido', 'gas', 'sintetico')
function getNormalizedPhase(el){
  const p = (el.phase || "").toLowerCase();
  if(p.includes("predicho") || p.includes("sintético") || p.includes("desconocido")) return "sintetico";
  if(p.includes("gas")) return "gas";
  if(p.includes("líquido") || p.includes("liquido")) return "liquido";
  return "solido";
}

// Convertir Kelvin a Celsius con formato legible
function kelvinToCelsius(kelvin){
  if(kelvin === null || kelvin === undefined) return null;
  const c = kelvin - 273.15;
  return Math.round(c * 100) / 100;
}

// Calcula electrones por capa (n) a partir de la configuración electrónica completa
function getShellOccupancy(configStr){
  const shells = {};
  configStr.split(/\s+/).forEach(sub => {
    if(!sub) return;
    const match = sub.match(/^(\d+)([a-z])(\d+)$/);
    if(!match) return;
    const n = parseInt(match[1], 10);
    const count = parseInt(match[3], 10);
    shells[n] = (shells[n] || 0) + count;
  });
  const maxN = Math.max(...Object.keys(shells).map(Number), 1);
  const result = [];
  for(let i = 1; i <= maxN; i++){
    result.push(shells[i] || 0);
  }
  return result;
}

