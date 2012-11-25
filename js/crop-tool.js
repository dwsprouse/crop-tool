(function($){
	"use strict";
	$(function() {	
		var canvas = document.getElementById('myCanvas');
		var ctx = canvas.getContext('2d');

		canvas.width = window.innerWidth - 20;
		canvas.height = window.innerHeight - 100;
		
		var sourceImg = new Image();   // Create new sourceImg element
		sourceImg.src = "images/dock.jpg";
		sourceImg.onload = function(){
			ctx.drawImage(sourceImg, 0, 0);
		}
		var restrictTo = "none"
		
		var select = {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			offsetX: 0,
			offsetY: 0,
			exists: false,
			//aspect: (2/3),
			aspectMod: 1
		};
		
		if (select.aspect) {
			select.numHandles = 4
		} else {
			select.numHandles = 8
		}
		
		
		var mouse = {
			x: 0,
			y: 0
		};
				
		//Define handle object
		function Handle(relX, relY) {
			this.x = 0;
			this.y = 0;
			this.width = 10;
			this.height = this.width;
			this.relX = relX;
			this.relY = relY;
		}
		//Define array that houses all 8 handles
		var selectHandles = [
			new Handle(0,0),  // top left
			new Handle(1,0),  // top right
			new Handle(1,1),  // bottom right 
			new Handle(0,1),  // bottom left
			new Handle(0.5,0),// top center
			new Handle(1,0.5),// right center
			new Handle(0.5,1),// bottom center
			new Handle(0,0.5) // left center
		];
		
		function handlePosition() {
			for (var i=0; i<select.numHandles; i++) {
				selectHandles[i].x = select.x - (selectHandles[i].width/2) + selectHandles[i].relX*select.width;
				selectHandles[i].y = select.y - (selectHandles[i].height/2) + selectHandles[i].relY*select.height;
			}
		}
	
		$(canvas).mousedown(function(){
			getMousePosition();
			if (!select.exists){
				startSelect();
			} else { 
				for (var i=0; i<select.numHandles; i++) {
					if (mouseTest(selectHandles[i])) {
						startResize(selectHandles[i]);
						return;
					}
				}

				if (mouseTest(select)) {
					startMoveSelect();
				} else {
					clearSelect();
					startSelect();
				}
			}
		});
		
		//debug settings
		$(document).mousemove(function() {
			$('#info1').html('Select X:' + select.x);	
			$('#info2').html('Select Y:' + select.y);
			$('#info3').html('Select Width:' + select.width);	
			$('#info4').html('Select Height:' + select.height);	
		});
		
		$(window).resize(function() {
			canvas.width = window.innerWidth - 20;	
			canvas.height = window.innerHeight - 100;
			drawCanvas();
		});
		
		function getMousePosition () {
			var offset = $(canvas).offset();
			mouse.x = event.pageX - offset.left;
			mouse.y = event.pageY - offset.top;
			mouse.x = (mouse.x < 0) ? 0 : (mouse.x > $(canvas).width) ? $(canvas).width : mouse.x;  
		    mouse.y = (mouse.y < 0) ? 0 : (mouse.y > $(canvas).height) ? $(canvas).height : mouse.y;
		}
	
		function drawCanvas () {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(sourceImg, 0, 0);
			if (select.exists){
				ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.clearRect(select.x, select.y, select.width, select.height);
				ctx.drawImage(sourceImg, select.x, select.y, select.width, select.height, select.x, select.y, select.width, select.height);
				ctx.strokeStyle = "#ffffff";
				ctx.strokeRect(select.x + .5, select.y + .5, select.width, select.height);
				handlePosition();
				ctx.fillStyle = "rgba(256, 256, 256, 0.5)";
				for (var i=0; i<select.numHandles; i++) {
					ctx.fillRect(selectHandles[i].x, selectHandles[i].y, selectHandles[i].width, selectHandles[i].height);
					ctx.strokeRect(Math.round(selectHandles[i].x) + .5, Math.round(selectHandles[i].y) +.5, selectHandles[i].width, selectHandles[i].height);
				}
			}
		}
	
		function mouseTest(rect) {
			return mouse.x >= rect.x && 
				mouse.y >= rect.y && 
				mouse.x <= (rect.x + rect.width) && 
				mouse.y <= (rect.y + rect.height);
		}
	
		function startSelect () {
			select.x = mouse.x;
			select.y = mouse.y;
			select.exists = true;
			$(document).bind("mousemove.set", sizeSelect)
					   .bind("mouseup.set", endSelect);
		}
		
		function startResize (handle) {
			select.aspectMod = 1;
			if (handle.relX == 0) {
				if (handle.relY == 1) {select.aspectMod = -1;}
				select.x += select.width;
				select.width *= -1;
			}
			
			if (handle.relY == 0) {
				if (handle.relX == 1) {select.aspectMod = -1;}
				select.y += select.height;
				select.height *= -1;
			}
			
			if (handle.relX == 0.5) {
				restrictTo = "vertical";
			}
			
			if (handle.relY == 0.5) {
				restrictTo = "horizontal";
			}
			$(document).bind("mousemove.set", sizeSelect)
					   .bind("mouseup.set", endSelect);
		}
	
		function sizeSelect() {
			getMousePosition();
			switch(restrictTo) {
				case "horizontal":
				  	select.width = mouse.x-select.x;
					break;
				case "vertical":
					select.height = mouse.y-select.y;
					break;
				default:
					var result = adjustToAspect(mouse.x-select.x, mouse.y-select.y, select.aspect);
					select.width = result.width;
					select.height = result.height;
			}
			drawCanvas();
		}
	
		function adjustToAspect(width, height, targetRatio) {
			var currentRatio = width / height,
			    currentAbsRatio = Math.abs(currentRatio),
				result = {width: width, height: height};

			if(currentAbsRatio > targetRatio) {
				result.width = Math.abs(height) * targetRatio * (width < 0 ? -1 : 1); // preserve sign
				result.height = height;
			} else if (currentAbsRatio < targetRatio) {
				result.width = width;
				result.height = Math.abs(width) / targetRatio * (height < 0 ? -1 : 1); // preserve sign
			}
			return result;
		}
		
		/*
		var result1 = adjustToAspect(300, 300, 3/2);
		console.log("300,300 to 3/2");
		console.log(result1);
		
		var result1 = adjustToAspect(-300, 300, 3/2);
		console.log("-300,300 to 3/2");
		console.log(result1);
		
		var result1 = adjustToAspect(-300, -300, 3/2);
		console.log("-300,-300 to 3/2");
		console.log(result1);
		
		var result1 = adjustToAspect(300, -300, 3/2);
		console.log("300,-300 to 3/2");
		console.log(result1);
		*/
		
		function endSelect() {
			$(document).unbind(".set");
			restrictTo = "none";
			if (select.width == 0 && select.height == 0) {
				select.exists = false;
			} else {
			select.x = select.width > 0 ? select.x : select.x + select.width;
			select.y = select.height > 0 ? select.y : select.y + select.height;
			select.width = Math.abs(select.width);
			select.height = Math.abs(select.height);
			}
			drawCanvas();
		}
		
		function startMoveSelect() {
			select.offsetX = select.x - mouse.x;
			select.offsetY = select.y - mouse.y;
			$(document).bind("mousemove.move", moveSelect)
					   .bind("mouseup.move", endMoveSelect);
		}
		
		function moveSelect() {
			getMousePosition();
			select.x = mouse.x + select.offsetX;
			select.y = mouse.y + select.offsetY;
			drawCanvas();
		}
		
		function endMoveSelect() {
			$(document).unbind(".move");
		}
		
		function clearSelect() {
			select.x = 0;
			select.y = 0;
			select.width = 0;
			select.height = 0;
			select.exists = false;
			drawCanvas();
		}
	});
})(jQuery);