(function($){
	"use strict";
	$(function() {	
		
		///////////////////
		/// Definitions ///
		///////////////////
		
		//Establishes canvas context
		var canvas = document.getElementById('myCanvas');
		var ctx = canvas.getContext('2d');
		canvas.width = window.innerWidth - 20;	
		canvas.height = window.innerHeight - 120;
		canvas.x = 0;
		canvas.y = 0;
				
		var restrictTo = "none";
		var action = "";
		
		//Define select
		var select = {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			//aspect: (16/9),
			offsetX: 0,
			offsetY: 0,
			exists: false
		};
		select.numHandles = select.aspect ? 4 : 8;
		
		//Define mouse
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
			new Handle(0,0),   // top left
			new Handle(1,0),   // top right
			new Handle(1,1),   // bottom right 
			new Handle(0,1),   // bottom left
			new Handle(0.5,0), // top center
			new Handle(1,0.5), // right center
			new Handle(0.5,1), // bottom center
			new Handle(0,0.5)  // left center
		];
		
		//Define image
		var image = {
			img: new Image(),
			x: 0,
			y: 0,
		}
		
		//Assign source to sample image of dock
		image.img.src = "images/dock.jpg";
	
		//On load image
		image.img.onload = function(){
			image.width = image.img.width;
			image.height = image.img.height;
			image.aspectRatio = image.width/image.height;
			
			//Size and position image to fit image inside canvas
			var scaleToFit = adjustToAspect(canvas.width, canvas.height, image.aspectRatio);
			image.adjW = scaleToFit.width;
			image.adjH = scaleToFit.height;
			image.x = scaleToFit.x;
			image.y = scaleToFit.y;
			
			//Define initial scale of image
			image.scale = image.adjW/image.width; // or could be = image.adjH/image.height;
			drawCanvas();
		}
		
		//debug settings
		$(document).mousemove(function() {
			var displayCoords = translateCoords(select.x, select.y, select.width, select.height);
			var relDisplayCoords = parentChild(image, displayCoords);
			$('#info1').html('Select X:' + relDisplayCoords.x);	
			$('#info2').html('Select Y:' + relDisplayCoords.y);
			$('#info3').html('Select Width:' + displayCoords.width);	
			$('#info4').html('Select Height:' + displayCoords.height);	
		});

		//////////////
		/// Events ///
		//////////////
		
		$(window).resize(function() {
			canvas.width = window.innerWidth - 20;	
			canvas.height = window.innerHeight - 120;
			
			image.adjW = image.scale * image.width; 
			image.adjH = image.scale * image.height;
			
			if (image.x < 0) {
				image.x = (image.x + image.adjW) < canvas.width ? canvas.width - image.adjW : image.x;
			} else {
 				image.x = image.adjW < canvas.width ? (canvas.width - image.adjW)/2 : 0; 
			}
			if (image.y < 0) {
				image.y = (image.y + image.adjH) < canvas.height ? canvas.height - image.adjH : image.y;
			} else {
 				image.y = image.adjH < canvas.height ? (canvas.height - image.adjH)/2 : 0; 
			}
			drawCanvas();
		});



		$(canvas).mousedown(function(){
			var result = translateCoords(select.x, select.y, select.width, select.height);
			select.x = result.x;
			select.y = result.y;
			select.width = result.width;
			select.height = result.height;
			
			if(document.getElementById('select').checked) {
			  action = "select";
			} else if(document.getElementById('translate').checked) {
			  action = "translate";
			 }else if(document.getElementById('scale').checked) {
			  action = "zoomIn";
			}
			
			switch(action) {
				case "select":
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
							moveSelect();
						} else {
							clearSelect();
							startSelect();
						}
					}
					break;
				case "translate":
					translateCanvas();
					break;
				case "zoomIn":
					scaleCanvas();
				
					break;
				case "zoomOut":
					break;		
			}
		});
		
		///////////////////
		/// Draw Canvas ///
		///////////////////
		
		function drawCanvas() {
			ctx.save();
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			//ctx.translate(canvas.x , canvas.y);
			ctx.drawImage(image.img, image.x, image.y, image.adjW, image.adjH);
			if (select.exists){
				ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.clearRect(select.x, select.y, select.width, select.height);
				ctx.drawImage(image.img, select.x - image.x, select.y - image.y, select.width, select.height, select.x, select.y, select.width, select.height);
				ctx.strokeStyle = "#ffffff";
				ctx.strokeRect(select.x + .5, select.y + .5, select.width, select.height);
				handlePosition();
				ctx.fillStyle = "rgba(256, 256, 256, 0.5)";
				for (var i=0; i<select.numHandles; i++) {
					ctx.fillRect(selectHandles[i].x, selectHandles[i].y, selectHandles[i].width, selectHandles[i].height);
					ctx.strokeRect(Math.round(selectHandles[i].x) + .5, Math.round(selectHandles[i].y) +.5, selectHandles[i].width, selectHandles[i].height);
				}
			}
			ctx.restore();
		}
		
		/////////////////
		/// Translate ///
		/////////////////
		
		function translateCanvas() {
			getMousePosition();
			var selectOffsetX = select.x - mouse.x;
			var selectOffsetY = select.y - mouse.y;
			var imgOffsetX = image.x - mouse.x;
			var imgOffsetY = image.y - mouse.y;
			$(document)
			.bind("mousemove.translate", function() {
				getMousePosition();
				select.x = mouse.x + selectOffsetX;
				select.y = mouse.y + selectOffsetY;
				image.x = mouse.x + imgOffsetX;
				image.y = mouse.y + imgOffsetY;
				drawCanvas();
			})
			.bind("mouseup.translate", function() {$(document).unbind(".translate");});
		}
	
		/////////////
		/// Scale ///
		/////////////
		
		//Scales image perfectly
		function scaleCanvas() {
			var multiplier = 1.1;
			
			image.adjTempW = image.scale * image.width;
			image.adjTempH = image.scale * image.height; 
			image.scale *= multiplier;
			image.adjW = image.scale * image.width;
			image.adjH = image.scale * image.height;

			image.tempX = canvas.width / 2 - ((canvas.width / 2 - image.x) * (image.adjW / image.adjTempW));
			image.tempY = canvas.height / 2 - ((canvas.height / 2 - image.y) * (image.adjH / image.adjTempH));

			if (multiplier >= 1) {
			image.x = image.tempX;
			image.y = image.tempY;
			} else {
				if (image.tempX < 0) {
					image.x = image.adjW > canvas.width ? canvas.width - image.adjW : (canvas.width - image.adjW)/2;
				} else {
	 				image.x = image.adjW < canvas.width ? (canvas.width - image.adjW)/2 : 0; 
				}
				
				if (image.tempY < 0) {
					image.y = image.adjH > canvas.height ? canvas.height - image.adjH : (canvas.height - image.adjH)/2;
				} else {
	 				image.y = image.adjH < canvas.height ? (canvas.height - image.adjH)/2 : 0; 
				}
			}
			drawCanvas();
		}

		
		
		//////////////
		/// Select ///
		//////////////
		
		function moveSelect() {
			getMousePosition();
			var selectOffsetX = select.x - mouse.x;
			var selectOffsetY = select.y - mouse.y;
			$(document)
			.bind("mousemove.move", function () {
				getMousePosition();
				select.x = mouse.x + selectOffsetX;
				select.y = mouse.y + selectOffsetY;
				drawCanvas();
			})
		 	.bind("mouseup.move", function() {$(document).unbind(".move");});
		}
	
		function startSelect () {
			select.x = mouse.x;
			select.y = mouse.y;
			select.exists = true;
			$(document).bind("mousemove.set", sizeSelect)
					   .bind("mouseup.set", endSelect);
		}
		
		function startResize (handle) {
			if (handle.relX == 0) {
				select.x += select.width;
				select.width *= -1;
			}
			if (handle.relY == 0) {
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
		
		function endSelect() {
			$(document).unbind(".set");
			restrictTo = "none";
			if (select.width == 0 && select.height == 0) {
				select.exists = false;
			}
			drawCanvas();
		}
		
		function clearSelect() {
			select.x = 0;
			select.y = 0;
			select.width = 0;
			select.height = 0;
			select.exists = false;
			drawCanvas();
		}
		
		////////////
		/// MATH ///
		////////////
		
		//Determine relative x and y coordinates for child to parent
		function parentChild (parent, child) {
			var result = {x: child.x - parent.x,
				 y: child.y - parent.y};
			return result;
		}
		
		//translate to positive coordinates
		function translateCoords (x, y, width, height) {
			var result = {x: width > 0 ? x : x + width,
				 y: height > 0 ? y : y + height,
				 width: Math.abs(width),
				 height: Math.abs(height)};
			return result;
		}
		
		//Constrains width and height to target ratio
		function adjustToAspect(width, height, targetRatio) {
			var currentRatio = width / height,
			    currentAbsRatio = Math.abs(currentRatio),
				result = {width: width, height: height};

			if(currentAbsRatio > targetRatio) {
				result.width = Math.abs(height) * targetRatio * (width < 0 ? -1 : 1); // preserve sign
				result.height = height;
				result.x = (width - result.width)/2;
				result.y = 0;
			} else if (currentAbsRatio < targetRatio) {
				result.width = width;
				result.height = Math.abs(width) / targetRatio * (height < 0 ? -1 : 1); // preserve sign
				result.x = 0;
				result.y = (height - result.height)/2;
			}
			return result;
		}
		
		//Get mouse position
		function getMousePosition() {
			var offset = $(canvas).offset();
			mouse.x = event.pageX - offset.left;
			mouse.y = event.pageY - offset.top;
			mouse.x = (mouse.x < 0) ? 0 : (mouse.x > $(canvas).width) ? $(canvas).width : mouse.x;  
		    mouse.y = (mouse.y < 0) ? 0 : (mouse.y > $(canvas).height) ? $(canvas).height : mouse.y;
		}
		
		//Determine if mouse is within rect
		function mouseTest(rect) {
			return mouse.x >= rect.x && 
				mouse.y >= rect.y && 
				mouse.x <= (rect.x + rect.width) && 
				mouse.y <= (rect.y + rect.height);
		}	
		
		//Determine position of select handles
		function handlePosition() {
			for (var i=0; i<select.numHandles; i++) {
				selectHandles[i].x = select.x - (selectHandles[i].width/2) + selectHandles[i].relX*select.width;
				selectHandles[i].y = select.y - (selectHandles[i].height/2) + selectHandles[i].relY*select.height;
			}
		}	
	});
})(jQuery);