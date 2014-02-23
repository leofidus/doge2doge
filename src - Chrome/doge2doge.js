(function() {
	function isNum(n) {
		return (n && !isNaN(parseFloat(n)) && isFinite(n));
	}

	function start(e) {
		var xmlhttp = new XMLHttpRequest();

		var theUrl = 'http://anonym.lionservers.de/api/doge-usd.txt';
		xmlHttp = new XMLHttpRequest();
		xmlHttp.open("GET", theUrl, true );
		xmlHttp.onload = function () {
			var dogecoin = parseFloat(this.responseText);

			if (!isNum(dogecoin) || dogecoin == 0) {
				console.log ("Dogecoin exchange rate unavailable");
				return false;
			}
			walk(e, dogecoin);
		}
		xmlHttp.send();
		
	}

    function walk(node, dogecoin) {
		// I stole this function from here:
		// http://is.gd/mwZp7E

		var child;
		var stack = new Array();
		var textnodes = new Array();
		stack.push(node);
		while(stack.length > 0) {
			node = stack.pop();
			switch ( node.nodeType )  
			{
				case 1:  // Element
					if(!(node instanceof HTMLElement))
						break;
					if(node instanceof HTMLScriptElement)
						break;
					if(node instanceof HTMLAppletElement)
						break;
					if(node instanceof HTMLInputElement)
						break;
					if(node instanceof HTMLTextAreaElement)
						break;
					if(node instanceof HTMLSelectElement)
						break;
				case 9:  // Document
				case 11: // Document fragment
					child = node.firstChild;
					while ( child ) 
					{
						stack.push(child);
						child = child.nextSibling;
					}
					break;

				case 3: // Text node
					if(node.nodeValue.indexOf('$') != -1)
						textnodes.push(node);
					break;
			}
		}
		
		if(textnodes.length > 0) {
			//asynchronously call "handleText(textnodes.pop(), dogecoin);" till array empty
			chunk(textnodes, handleText, dogecoin);
		}
    }
    
    function handleText(textNode, dogecoin) {
		if(typeof textNode == 'undefined')	//node already deleted
			return;
		var v = textNode.nodeValue;
		
		var m = parse(v);
		var offset = 0;
		
		if(m) {
			m.forEach(function(match) {
				var fiat = match.val;
				var doge = fiat / dogecoin;
				var doge = " (Ɖ" + format(doge) + ")";
				var beginning = v.slice(0, match.end + offset);
				var end = v.slice(match.end + offset);
				v = beginning + doge + end;
				offset += doge.length;
			});
		}
    
        textNode.nodeValue = v;
	}
    
	//return an array of all currency strings
	function parse(str) {
		var result = new Array();
	
		var l = str.length;
		str = str + ' ';
		var cur = false;            //is currency
		var num = false;            //is number
		var since_dot = 0;
		var since_comma = 0;
		var has_dot = false;
		var has_comma = false;     
		var cur_str = '';           //currency string
		var us = true;              //is in US number format
		var num_start = 0;
		var end_num = function(i, mul) {
			if(!num) return;
			if(cur) {
				var last;
				var l = cur_str.length;
				if(l > 0 && (cur_str[l-1] == '.' || cur_str[l-1] == ','))
					last = i-1;
				else
					last = i;
				result.push({
					val: convert(cur_str, us) * mul,
					start: num_start,
					end: last,
					us_format: us
				});
			}
			cur = false;
			num = false;
			since_dot = 0;
			since_dot = 0;
			since_comma = 0;
			has_dot = false;
			has_comma = false;
			cur_str = '';
			us = true;
		};
		
		for(var i=0; i<l; i++) {
			switch(str[i]) {
				case '$': end_num(i, 1); cur = true; break;
				case '0': 
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					if(cur == false) break;
					if(!num) num_start = i;
					since_dot++;
					since_comma++;
					num = true;
					cur_str += str[i];
					break;
				case '.':
					var legal = cur;
					if(legal && has_dot && (str[i+1] != ' ')) {   //second dot
						if(has_comma) {
							legal = false;
						}
						if(since_dot > 3 || since_dot < 3) {
							legal = false;
						} else {
							us = false;
						}
					}
					if(legal) {
						has_dot = true;
						since_dot = 0;
						cur_str += '.';
					} else {
						cur = false;
						end_num(i, 1);
					}
					break;
				case ',':
					var legal = cur;
					if(legal && has_comma && (str[i+1] != ' ')) {   //second comma
						if(has_dot) {
							legal = false;
						}
						if(since_comma > 3 || since_comma < 3) {
							legal = false;
						}
					}
					if(legal) {
						has_comma = true;
						since_comma = 0;
						cur_str += ',';
					} else {
						cur = false;
						end_num(i, 1);
					}
					break;
				case ' ':
					if(num) {
						if(isSubstrMillion(str, i+1))
							end_num(firstWhiteAfter(str, i+7), 1000000);
						else
							end_num(i, 1);
					}
					break;
				default:
					cur = false;
					if(num) end_num(i, 1);
					break;
			}
		}
		end_num(l+1, 1);
		return result;
	}

	function isSubstrMillion(str, pos) {
		return (str[pos] == 'm' && str[pos+1] == 'i' && str[pos+2] == 'l' && str[pos+3] == 'l' && str[pos+4] == 'i' && str[pos+5] == 'o' && str[pos+6] == 'n');
	}
	
	function firstWhiteAfter(str, pos) {
		var len = str.length;
		for(i = pos+1; i < len; i++) {
			if(str[i] == ' ' || str[i] == '.' || str[i] == ',')
				return i;
		}
		return len;
	}
	
	function convert(n, us) {
		var thousand_sep = (us?/,/g:/\./g);
		n = n.replace(thousand_sep, '');
		if(!us) n = n.replace(/,/g,'.');
		return parseFloat(n);
	}
	
	function format(n) {
		//rounding first would introduce floating point
		//errors resulting in .9999999999 numbers
		var s = '';
		if(n > 1000000000000) {
			n = n/1000000000000;
			s = 'T';
		}
		else if(n > 1000000000) {
			n = n/1000000000;
			s = 'G';
		}
		else if(n > 1000000) {
			n = n/1000000;
			s = 'M';
		}
		else if(n > 1000) {
			n = n/1000;
			s = 'k';
		}
		else if(n < 0.001) {
			n = n*1000;
			s = 'm';
		}
		else if(n < 0.000001) { 
			n = n*1000000;
			s = 'μ';
		}
		return roundToSignificantFigures(n, 2) + s;
	}
	
	//adapted from http://stackoverflow.com/questions/202302/rounding-to-an-arbitrary-number-of-significant-digits
	function roundToSignificantFigures(num, n) {
		if(num == 0) {
			return 0;
		}

		var d = Math.ceil(Math.log(num < 0 ? -num: num)/Math.log(10));
		var power = n - d;

		var magnitude = Math.pow(10, power);
		var shifted = Math.round(num*magnitude);
		return shifted/magnitude;
	}

	function chunk(array, process, param, context){
		setTimeout(function(){
			var start = performance.now();
			do {
				var item = array.pop();
				process.call(context, item, param);
			} while(array.length > 0 && performance.now()-start < 20)	//don't recurse too deep, timeouts get slow

			if (array.length > 0){
				setTimeout(arguments.callee, 0);
			}
		}, 0);
	}
	
    function windowLoadHandler()
    {
        window.removeEventListener('load', windowLoadHandler);

        document.getElementById('appcontent').addEventListener('DOMContentLoaded', start);
    }

    //window.addEventListener('load', windowLoadHandler);
	start(document.documentElement);
}());
