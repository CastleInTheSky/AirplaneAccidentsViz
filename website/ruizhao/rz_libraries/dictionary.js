var filterNamesDict = [
		["child", "adult", "yadult", "oadult"], 
		["nofilter"], 
		["male", "female"], 
		["black", "white", "amindian", "asian"], 
		["handgun", "shotgun", "rifle", "other"], 
		["midwest", "northwest", "northeast", "southwest", "southeast"], 
		["single", "multiple"]
	];

var filterTypesDict = [
	"ages",
	"",
	"sexes",
	"ethnicities",
	"guns",
	"regions",
	"victims"
];

var filterTypesDispDict = [
	"AGE GROUP",
	"",
	"SEX",
	"ETHNICITY",
	"GUN TYPE",
	"REGION",
	"MULTIPLE KILLS"
];

var filterDisplayNamesDict = {
	nofilter: "people",
	handgun: "with a handgun",
	shotgun: "with a shotgun",
	rifle: "with a rifle",
	other: "with an unknown gun",
	child: "children",
	adult: "adults",
	yadult: "young adults",
	oadult: "people over 30",
	male: "men",
	female: "women",
	black: "black",
	white: "white",
	amindian: "native",
	asian: "asian",
	midwest: "in the midwest",
	northwest: "in the northwest",
	northeast: "in the northeast",
	southwest: "in the southwest",
	southeast: "in the southeast",
	single: "in single-victim killings",
	multiple: "in multiple-victim killings"
}

var altFilterDict = {
	nofilter: "people",
	handgun: "with other guns",
	shotgun: "with other guns",
	rifle: "with other guns",
	other: "with other guns",
	child: "adults",
	adult: "children",
	yadult: "people over 30",
	oadult: "young adults",
	male: "women",
	female: "men",
	black: "other ethnicities",
	white: "other ethnicities",
	amindian: "other ethnicities",
	asian: "other ethnicities",
	midwest: "in other regions",
	northwest: "in other regions",
	northeast: "in other regions",
	southwest: "in other regions",
	southeast: "in other regions",
	single: "in multiple-victim killings",
	multiple: "in single-victim killings"
}

var sexDemonymDict = {
	male: ["babies", "kids", "men"],
	female: ["babies", "kids", "women"]
}

var altSexDemonymDict = {
	male: ["babies", "kids", "women"],
	female: ["babies", "kids", "men"]
}

var sexDict = {
	M: "man",
	F: "woman",
	U: "person"
}

var posPronounDict = {
	M: "his",
	F: "her",
	U: "their"
}

var pronounDict = {
	M: "he",
	F: "she",
	U: "they"
}

var raceDict = {
	B: "black",
	W: "white",
	I: "native",
	A: "asian",
	U: ""
}

var monthDict = {
	0 : "2010", 
	1 : "January", 
	2 : "February", 
	3 : "March", 
	4 : "April", 
	5 : "May", 
	6 : "June", 
	7 : "July", 
	8 : "August", 
	9 : "September", 
	10 : "October", 
	11 : "November", 
	12 : "December"
};

var stateDict = {
	AK : "Alaska",
	AL : "Alabama",
	AR : "Arkansas",
	AZ : "Arizona",
	CA : "California",
	CO : "Colorado",
	CT : "Connecticut",
	DC : "Washington, DC",
	DE : "Delaware",
	GA : "Georgia",
	HI : "Hawaii",
	IA : "Iowa",
	ID : "Idaho",
	IL : "Illinois",
	IN : "Indiana",
	KS : "Kansas",
	KY : "Kentucky",
	LA : "Louisiana",
	MA : "Massachusetts",
	MD : "Maryland",
	ME : "Maine",
	MI : "Michigan",
	MN : "Minnesota",
	MO : "Missouri",
	MS : "Mississippi",
	MT : "Montana",
	NC : "North Carolina",
	ND : "North Dakota",
	NE : "Nebraska",
	NH : "New Hampshire",
	NJ : "New Jersey",
	NM : "New Mexico",
	NV : "Nevada",
	NY : "New York",
	OH : "Ohio",
	OK : "Oklahoma",
	OR : "Oregon",
	PA : "Pennsylvania",
	RI : "Rhode Island",
	SC : "South Carolina",
	SD : "South Dakota",
	TN : "Tennessee",
	TX : "Texas",
	UK : "America",
	UT : "Utah",
	VA : "Virginia",
	VI : "the US Virgin Islands",
	VT : "Vermont",
	WA : "Washington",
	WI : "Wisconsin",
	WV : "West Virginia",
	WY : "Wyoming"
}

var relationDict = [
	["acquaintance", "boyfriend", "brother", "daughter", "employee", "employer", "ex-husband", "ex-wife", "family member", "father", "friend", "girlfriend", "homosexual significant other", "husband", "in-law", "mother", "neighbor", "sister", "son", "stepdaughter", "stepfather", "stepmother", "stepson", "wife", "non-stranger"], 
	["stranger"],
	["unknown"]
]

var relationDispDict = {
	"M": {
		"acquaintance": "acquaintance",
		"boyfriend": "boyfriend",
		"brother": "brother",
		"daughter": "father",
		"employee": "employer",
		"employer": "employee",
		"ex-husband": "ex-wife",
		"ex-wife": "ex-husband",
		"family member": "family member",
		"father": "son",
		"friend": "friend",
		"girlfriend": "boyfriend",
		"homosexual significant other": "homosexual significant other",
		"husband": "husband",
		"in-law": "in-law",
		"mother": "son",
		"neighbor": "neighbor",
		"sister": "brother",
		"son": "father",
		"stepdaughter": "step-father",
		"stepfather": "step-son",
		"stepmother": "step-son",
		"stepson": "step-father",
		"wife": "husband",
		"stranger": "stranger",
		"non-stranger": "acquaintance",
		"unknown" : "unknown"
	},
	"F": {
		"acquaintance": "acquaintance",
		"boyfriend": "girlfriend",
		"brother": "sister",
		"daughter": "mother",
		"employee": "employer",
		"employer": "employee",
		"ex-husband": "ex-wife",
		"ex-wife": "ex-wife",
		"family member": "family member",
		"father": "daughter",
		"friend": "friend",
		"girlfriend": "girlfriend",
		"homosexual significant other": "homosexual significant other",
		"husband": "wife",
		"in-law": "in-law",
		"mother": "daughter",
		"neighbor": "neighbor",
		"sister": "sister",
		"son": "mother",
		"stepdaughter": "step-mother",
		"stepfather": "step-daughter",
		"stepmother": "step-daughter",
		"stepson": "step-mother",
		"wife": "wife",
		"stranger": "stranger",
		"non-stranger": "acquaintance",
		"unknown" : "unknown"
	},
	"U": {
		"acquaintance": "acquaintance",
		"boyfriend": "significant other",
		"brother": "sibling",
		"daughter": "parent",
		"employee": "employer",
		"employer": "employee",
		"ex-husband": "ex-wife",
		"ex-wife": "ex-husband",
		"family member": "family member",
		"father": "child",
		"friend": "friend",
		"girlfriend": "significant other",
		"homosexual significant other": "homosexual significant other",
		"husband": "wife",
		"in-law": "in-law",
		"mother": "child",
		"neighbor": "neighbor",
		"sister": "sibling",
		"son": "parent",
		"stepdaughter": "step-parent",
		"stepfather": "step-child",
		"stepmother": "step-child",
		"stepson": "step-parent",
		"wife": "husband",
		"stranger": "stranger",
		"non-stranger": "acquaintance",
		"unknown" : "unknown"
	}
};

var circDict = [
	["rape","robbery","burglary","larceny","motor vehicle theft","sex offense","lover's triangle","brawl due to influence of alcohol","brawl due to influence of narcotics","sniper attack","gangland killing","juvenile gang killing","suspected felony","felony","felony"],
	["arson","abortion","argument over money or property","argument","institutional killing"],
	["child killed by babysitter","prostitution","breaking narcotic drug law","gambling"],
	["indeterminate","unspecified","other"]
];

var circDispDict = {
"02" : "rape",
"03" : "robbery",
"05" : "burglary",
"06" : "larceny",
"07" : "motor vehicle theft",
"17" : "sex offense",
"40" : "lover's triangle",
"42" : "brawl due to influence of alcohol",
"43" : "brawl due to influence of narcotics",
"49" : "sniper attack",
"46" : "gang killing",
"47" : "juvenile gang killing",
"70" : "suspected felony",
"80" : "felony",
"81" : "felony",
"10" : "prostitution",

"09" : "arson",
"32" : "abortion",
"44" : "argument over money or property",
"45" : "argument",
"48" : "institutional killing",

"41" : "being looked after",
"18" : "breaking narcotic drug law",
"19" : "gambling",

"99" : "indeterminate",
"26" : "unspecified",
"60" : "other",
}

