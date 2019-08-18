/*首先咱们先回忆一下p5的绘制的原理哈，就是在一个画布上面画画，然后需要动画的话，就通过刷新画布实现*/

//先定义一些变量，整体的解释在下面15行的位置，各个变量的作用标记在了下面每行的后面
var cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4, cx5, cy5, cx6, cy6, cx7, cy7;//我们不是画了7个表盘，这里的每一对cx和cy就是一个表盘的圆心的坐标
var cwidth = 1280;//画布的宽度
var tickDistance = 360 / 144;//每个表盘有144个格子（24小时+60分+60秒）
var longTick = 20;//表盘上面有两种tick，每过几个短的tick就会有一个长的tick，比如对于60分钟的ticks，每过4个短tick会有一个长tick，即5分钟为一组
var shortTick = 10;//短tick
var R = 640/(1+Math.sin(Math.PI/12));//我们绘制的表盘排列在一个大的半圆上，这个R就是大半圆的半径；640是画布宽度的一半
var r = 640 - R - longTick;//表盘的半径
var innerR = 8;//在大半圆圆心位置的几个小圆点的半径
var innerMargin = 4;//圆心几个小圆点的间距
var cheight = R + 2*r;//画布的高度
var clockCenters = new Array();//array为数组，可以理解为用来装多个变量的容器，这个clockCenters就是用来将表盘的圆心一对一对的存起来
var innerCenters = new Array();//这个变量是用来将大圆中心的那些小点的圆心一对一对的存起来
var useMinPerHour = new Array();//这个用来存储每天中每小时内房间被占用了多久，比如9点到10点这一个小时内，总共被占用了20分钟，那么就在9点到10点这个对应的位置存储20这个数字
/*从这里之上都是在声明变量，就像是我们先定义一个x=5，然后后面再用x去做别的事情，这里上面这些东西就是在定义变量。
  每一个var后面跟着的就是新定义出来的变量，变量后面的等号右边就是这个变量的值
  也可以只先定义出变量的名字但是不进行赋值，比如第一行，var后面跟着一串变量名，每个变量名用逗号隔开的，这里就是只定义了14个变量的名字但是暂时没有赋值。
  上面每个变量后面的作用都标记在了后面*/


/*下面就准备读取数据进行绘制了
  首先说下这个function的概念，就拿下面这个function来举例说明
  function quadraticCurve(x1, y1, x2, y2, x3, y3, lineWidth, r, g, b, a)
  这里function这个词是用来声明（定义）一个函数的，function后面跟着的词就是这个函数的名字。
  一个函数一般来说就是用来完成某种特定的功能，这个功能一般来讲可以在函数名中看出来。就比如quadraticCurve这个函数就是用来绘制二次曲线的
  再后面括号里面的内容就是在执行（使用）这个函数的时候需要用到的变量（原材料）
  比如二次曲线这个函数就需要用到三个点的坐标（x1,y1,x2,y2,x3,y3），所绘制的曲线的粗细（lineWidth），以及曲线的RGB颜色和透明度（r,g,b,a）
  函数内部的代码，即具体是怎么实现的，就像这里这个二次曲线具体是怎么使用这些变量画出来的。就是后面用大括号框起来的部分。

  介绍完函数，就看咱们这几个表盘是怎么用几个函数配合着画出来的。
  首先还是回顾p5的流程，流程里面有这样几个函数：preload，setup，draw，作用分别是：
    preload：在画之前先加载一些东西，比如数据等，此函数只执行一次
    setup：设置一些首次设置后面就不需要变得东西，比如画布的大小呀等等，此函数只执行一次
    draw：绘制，这个函数会在网页页面加载完成之后不断循环执行，如果每次绘制的内容不一样就会产生动画的效果
  下面先来list一下咱们下面的几个函数：
  	quadraticCurve
  	scaleColor
  	drawClockFace
  	drawHMCurves
  	drawHMSCurves
  	drawHCurves
  	preload
  	setup
  	draw
  最后三个就是刚刚说的p5绘制的流程里面的三个函数
  前面的函数都是会在绘制的时候用到的函数，即都会在draw这个函数里面用到，具体函数的作用会在下面具体解释*/


/*这个函数刚刚说过了，是用来绘制二次曲线的*/
function quadraticCurve(x1, y1, x2, y2, x3, y3, lineWidth, r, g, b, a) {
	var canvas = document.getElementById('defaultCanvas0');
	var context = canvas.getContext('2d');//这一行和上一行是得到画布，可以想象成是我们知道要在哪个画布上去画了

	//下面的六行代码完成了一根曲线的绘制
	context.beginPath();//把笔接触到画布上
	context.moveTo(x1, y1);//把画笔移动到x1，y1这个坐标上
	context.quadraticCurveTo(x2, y2, x3, y3);//通过二次曲线轨迹到x3，y3的位置，中间的x2，y2是圆心
	context.lineWidth = lineWidth;//设置线的宽度
	context.strokeStyle = "rgba("+r+", "+g+", "+b+", "+a+")";//设置线的颜色
	context.stroke();//画线
}

/*这个函数用来计算颜色的渐变，即对于我们给定的一个区间，比如0~10，颜色从颜色1渐变到颜色2，然后给出一个中间值，计算出相应的颜色，
  原理很简单，我们先来看把0~10这个区间scale到1~100，然后看50对应的值怎么做呢，
  那就是1对应0,100对应10,50对应的值就是(50-1)/(100-1)先来计算出50在原来的区间里面的位置，然后再*10+0，计算出他在0~10这个区间内所对应的值。
  现在变成颜色了原理是一样的，因为颜色是用RGB表示，即三个值，也就是相同的算法分别在R，G，B上面计算1遍就好了，最后得到对应的R，G，B三个值拼起来就是对应的颜色*/
function scaleColor(minValue, maxValue, value){
	let startR = 190, startG = 190, startB = 190;//初始颜色的RGB值
	let endR = 242, endG = 102, endB = 102;//结束颜色的RGB值

	//分别计算结果的R，G，B值
	let resultR = startR + (endR - startR) * (value - minValue)/(maxValue - minValue);
	let resultG = startG + (endG - startG) * (value - minValue)/(maxValue - minValue);
	let resultB = startB + (endB - startB) * (value - minValue)/(maxValue - minValue);

	//返回计算好的颜色值
	return [resultR, resultG, resultB];
}

/*这个方法是就是像咱们之前说过的那种，一个表盘上面分成144份，然后绘制ticks*/
function drawClockFace(tmpCx, tmpCy){
	//draw ticks
	for (var i = 0; i < 144; i++) {
		var radius = radians(i * tickDistance) - HALF_PI - radians(tickDistance * 12);
		if (i < 24) { //绘制小时对应的ticks
			noFill();//设置接下来绘制的图形（线）没有填充
			stroke(255, 131, 21);//设置接下来绘制的图形（线）的边框颜色
			strokeWeight(2);//设置边框的宽度，如果是线的话就是设置线的粗细
			//每4个小时为一组，即每画三根短的ticks画一根长的tick
			if ((i + 1) % 4 == 0) {//判断是不是4的整数倍
				line(tmpCx, tmpCy, tmpCx + cos(radius) * (r + longTick), tmpCy + sin(radius) * (r + longTick));
			} else {//不是的话就画短的tick
				line(tmpCx, tmpCy, tmpCx + cos(radius) * (r + shortTick), tmpCy + sin(radius) * (r + shortTick));
			}
		} else if (i >= 24 && i < 84) {//分钟对应的ticks
			noFill();
			stroke(122, 198, 248);
			strokeWeight(2);
			//5分钟为一组
			if ((i + 1) % 5 == 0) {//判断是不是5的整数倍
				line(tmpCx, tmpCy, tmpCx + cos(radius) * (r + longTick), tmpCy + sin(radius) * (r + longTick));
			} else {
				line(tmpCx, tmpCy, tmpCx + cos(radius) * (r + shortTick), tmpCy + sin(radius) * (r + shortTick));
			}
		} else {//秒对应的ticks
			noFill();
			stroke(200, 200, 200);
			strokeWeight(2);
			//5秒钟为一组
			if ((i + 1) % 5 == 0) {//判断是不是5的整数倍
				line(tmpCx, tmpCy, tmpCx + cos(radius) * (r + longTick), tmpCy + sin(radius) * (r + longTick));
			} else {
				line(tmpCx, tmpCy, tmpCx + cos(radius) * (r + shortTick), tmpCy + sin(radius) * (r + shortTick));
			}
		}
	}
	//接下来在中心绘制一个大的白色的圆，因为所有的tick都是从圆心发出的，所以在上面绘制一个白色的圆盖住不需要的部分
	noStroke();//没有边框
	fill(255);//白色填充
	ellipse(tmpCx, tmpCy, 2 * r);//绘制圆，三个参数分别是圆心坐标x，圆心坐标y，圆的半径
}

/*绘制连接小时和分钟的弧线*/
function drawHMCurves(tmpCx, tmpCy, m, h, occupy){
	fill(0);
	stroke(0);
	strokeWeight(5);

	var m = radians(m * tickDistance) - HALF_PI + radians(tickDistance * 12);//计算分钟对应的圆心角弧度
	var h = radians((h - 1) * tickDistance) - HALF_PI - radians(tickDistance * 12);//计算小时对应的圆心角弧度

	let colorR = 0, colorG = 0, colorB = 0, colorA = 0;
	//根据这一时刻的占用情况计算弧线的颜色，occupy=0表示没有占用，occupy=1表示占用
	if(occupy == 0){
		colorR = colorG = colorB = 230; colorA = 0.1;
	}else{
		colorR = 242;
		colorG = 102;
		colorB = 102; 
		colorA = 0.3;
	}
	//绘制曲线，tmpCx和tmpCy即当前的表盘的圆心坐标
	quadraticCurve(cos(m) * r + tmpCx, sin(m) * r + tmpCy, tmpCx, tmpCy, cos(h) * r + tmpCx, sin(h) * r + tmpCy, 2, colorR, colorG, colorB, colorA);
}

/*绘制连接小时和分钟的弧线和连接分钟和秒的弧线*/
function drawHMSCurves(tmpCx, tmpCy, s, m, h, occupy){
	fill(0);
	stroke(0);
	strokeWeight(5);

	var s = radians(s * tickDistance) + HALF_PI;
	var m = radians(m * tickDistance) - HALF_PI + radians(tickDistance * 12);
	var h = radians((h - 1) * tickDistance) - HALF_PI - radians(tickDistance * 12);

	let colorR = 0, colorG = 0, colorB = 0, colorA = 0;
	if(occupy == 0){
		colorR = colorG = colorB = 0; colorA = 0.3;
	}else{
		colorR = 242;
		colorG = 102;
		colorB = 102; 
		colorA = 0.6;
	}

	quadraticCurve(cos(m) * r + tmpCx, sin(m) * r + tmpCy, tmpCx, tmpCy, cos(s) * r + tmpCx, sin(s) * r + tmpCy, 2, colorR, colorG, colorB, colorA);
	quadraticCurve(cos(m) * r + tmpCx, sin(m) * r + tmpCy, tmpCx, tmpCy, cos(h) * r + tmpCx, sin(h) * r + tmpCy, 2, colorR, colorG, colorB, colorA);
}

/*绘制连接大半圆中间的小点和小时的弧线*/
function drawHCurves(x1, y1, x2, y2, x3, y3, minv, maxv, v){
	let tmpCX = (x2+x3)/2;
	let tmpCY = (y2+y3)/2;
	let rgbcolor = scaleColor(minv, maxv, v);
	quadraticCurve(x1, y1, tmpCX, tmpCY, x3, y3, 1, rgbcolor[0], rgbcolor[1], rgbcolor[2], 0.5);
}

/*下面就是p5的流程了*/
/*加载数据*/
function preload() {
  var url = "data/randData.json";//数据的路径
  randData = loadJSON(url);//最前面定义的一个变量randData，现在把读好的数据赋值给randData
}

//设置一些属性
function setup() {
	createCanvas(cwidth, cheight);//创建画布
	var canvas = document.getElementById("defaultCanvas0");
	canvas.style.width = cwidth+"px";//设置画布的宽度
	canvas.style.height = cheight+"px";//设置画布的高度

	//计算七个表盘的圆心位置，并存储在最前面定义的变量clockCenters里面。
	cx1 = r + longTick;
	cy1 = height - (r + longTick);
	clockCenters.push([cx1,cy1]);
	cx2 = r+longTick+2*(r+longTick)*Math.sin(Math.PI/12);
	cy2 = height - (r + longTick + 2*(r+longTick)*Math.cos(Math.PI/12));
	clockCenters.push([cx2,cy2]);
	cx3 = width/2 - 2*(r+longTick)*Math.cos(Math.PI/12);
	cy3 = height - (r+longTick+2*(r+longTick)*Math.cos(Math.PI/12)*Math.sqrt(3));
	clockCenters.push([cx3,cy3]);
	cx4 = width/2;
	cy4 = r + longTick;
	clockCenters.push([cx4,cy4]);
	cx5 = width/2 + 2*(r+longTick)*Math.cos(Math.PI/12);
	cy5 = cy3;
	clockCenters.push([cx5,cy5]);
	cx6 = width - (r+longTick+2*(r+longTick)*Math.sin(Math.PI/12));
	cy6 = cy2;
	clockCenters.push([cx6,cy6]);
	cx7 = width - r - longTick;
	cy7 = cy1;
	clockCenters.push([cx7,cy7]);

	//计算大半圆中间的7个小圆的位置
	innerCenters.push([width/2-6*innerR-3*innerMargin, height-r-longTick]);
	innerCenters.push([width/2-4*innerR-2*innerMargin, height-r-longTick]);
	innerCenters.push([width/2-2*innerR-1*innerMargin, height-r-longTick]);
	innerCenters.push([width/2, height-r-longTick]);
	innerCenters.push([width/2+2*innerR+1*innerMargin, height-r-longTick]);
	innerCenters.push([width/2+4*innerR+2*innerMargin, height-r-longTick]);
	innerCenters.push([width/2+6*innerR+3*innerMargin, height-r-longTick]);

	//处理数据
	hashData = new Array();
	for(let i = 0, len1 =  randData.data.length; i < len1; i++){
		let tmpRecorder = 0;
		hashData[i] = new Array();
		useMinPerHour[i] = new Array(24);
		for(let j = 0; j < 24; j++){
			useMinPerHour[i][j] = 0;//用于统计每天中每个小时内的占用情况
		}

		let occupied = false;
		for(let j = 0, len2 = 24*60; j < len2; j++){
			if(j == randData.data[i].occupations[tmpRecorder].startTime){
				occupied = true;
			}else if(j == randData.data[i].occupations[tmpRecorder].endTime){
				occupied = false;
				if(tmpRecorder < randData.data[i].occupations.length-1){
					tmpRecorder++;
				}
			}
			if(occupied){
				hashData[i][j] = 1;//根据数据中的使用情况，将对应的时刻的位置设置成占用
				useMinPerHour[i][j/60]++;
			}else{
				hashData[i][j] = 0;//根据数据中的使用情况，将对应的时刻的位置设置成非占用
			}
		}
	}
}

function draw() {
	var date = new Date(); 
	var day = date.getDay();
	var hour = date.getHours();
	var minute = date.getMinutes();
	var second = date.getSeconds();

	background(255);

	//draw clockFaces
  	for(let i = 0; i < 7; i++){
  		drawClockFace(clockCenters[i][0],clockCenters[i][1]);
  	}

	//统计每天中每小时内最长和最短的占用时间，用于计算从大半圆中间的小圆连接到每天的小时的弧线的颜色
	let minV = 1000000, maxV = 0;
	for(let i = 0; i < useMinPerHour.length; i++){
		for(let j = 0; j < useMinPerHour[i].length; j++){
			if(maxV < useMinPerHour[i][j]){
				maxV = useMinPerHour[i][j];
			}
			if(minV > useMinPerHour[i][j]){
				minV = useMinPerHour[i][j];
			}
		}
	}
	//绘制从大半圆圆心的小圆连接到小时的弧线
	for(let i = 0; i < day+1; i++){
		let nextClockCen;
		if(i < 3){
			nextClockCen = clockCenters[i+1];
		}else if (i == 3){
			nextClockCen = clockCenters[i];
		}else{
			nextClockCen = clockCenters[i-1];
		}
		let currentClockCen = clockCenters[i];//当前day的表盘的圆心
		let currentInnerCen = innerCenters[i];//当前day对应的中间的小圆点
		if(i < day){
			for(let j = 0; j < 24; j++){
				let radius = radians(j * tickDistance) - HALF_PI - radians(tickDistance * 12);
				let tmpX1 = currentClockCen[0] + cos(radius) * r;
				let tmpY1 = currentClockCen[1] + sin(radius) * r;
				drawHCurves(tmpX1, tmpY1, nextClockCen[0], nextClockCen[1], currentInnerCen[0], currentInnerCen[1], minV, maxV, useMinPerHour[i][j]);
			}
		}else{
			for(let j = 0; j < hour; j++){
				let radius = radians(j * tickDistance) - HALF_PI - radians(tickDistance * 12);
				let tmpX1 = currentClockCen[0] + cos(radius) * r;
				let tmpY1 = currentClockCen[1] + sin(radius) * r;
				drawHCurves(tmpX1, tmpY1, nextClockCen[0], nextClockCen[1], currentInnerCen[0], currentInnerCen[1], minV, maxV, useMinPerHour[i][j]);
			}
		}
	}
	

	//绘制中间的小圆点
	for(let i = 0; i < 7; i++){
		fill(150, 150, 150);
		noStroke();
	  	ellipse(innerCenters[i][0], innerCenters[i][1], 2*innerR, 2*innerR);
	  	fill(100);
		textSize(14);
		
		switch(i){
			case 0:
				translate(innerCenters[i][0], innerCenters[i][1]);
				rotate(PI/2);
				text("Sun.", 10, 5);
				rotate(3*PI/2);
				translate(-innerCenters[i][0], -innerCenters[i][1]);
				break;
			case 1:
				translate(innerCenters[i][0], innerCenters[i][1]);
				rotate(PI/2);
				text("Mon.", 10, 5);
				rotate(3*PI/2);
				translate(-innerCenters[i][0], -innerCenters[i][1]);
				break;
			case 2:
				translate(innerCenters[i][0], innerCenters[i][1]);
				rotate(PI/2);
				text("Tue.", 10, 5);
				rotate(3*PI/2);
				translate(-innerCenters[i][0], -innerCenters[i][1]);
				break;
			case 3:
				translate(innerCenters[i][0], innerCenters[i][1]);
				rotate(PI/2);
				text("Wed.", 10, 5);
				rotate(3*PI/2);
				translate(-innerCenters[i][0], -innerCenters[i][1]);
				break;
			case 4:
				translate(innerCenters[i][0], innerCenters[i][1]);
				rotate(PI/2);
				text("Thu.", 10, 5);
				rotate(3*PI/2);
				translate(-innerCenters[i][0], -innerCenters[i][1]);
				break;
			case 5:
				translate(innerCenters[i][0], innerCenters[i][1]);
				rotate(PI/2);
				text("Fri.", 10, 5);
				rotate(3*PI/2);
				translate(-innerCenters[i][0], -innerCenters[i][1]);
				break;
			case 6:
				translate(innerCenters[i][0], innerCenters[i][1]);
				rotate(PI/2);
				text("Sat.", 10, 5);
				rotate(3*PI/2);
				translate(-innerCenters[i][0], -innerCenters[i][1]);
				break;
		}
	}

	//draw previous days
	for(let i = 0; i < day; i++){
		for(let j = 0; j < hashData[i].length; j++){
			let h = j/60;
			let m = j%60;
			let occupy = hashData[i][j];
			drawHMCurves(clockCenters[i][0], clockCenters[i][1], m, h, occupy)
		}
	}
	//draw today
	let currentMin = minute + hour*60;
	for(let j = 0; j < currentMin; j++){
		let h = j/60;
		let m = j%60;
		let occupy = hashData[day][j];
		drawHMCurves(clockCenters[day][0], clockCenters[day][1], m, h, occupy)
		// drawHMSCurves(clockCenters[day][0], clockCenters[day][1], second, m, h, occupy)
	}
	drawHMSCurves(clockCenters[day][0], clockCenters[day][1], second, minute, hour, hashData[day][currentMin])
}
