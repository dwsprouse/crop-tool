(function($){
	"use strict";
	$(function() {	
		
		///////////////////
		/// Definitions ///
		///////////////////
		
		//Establishes canvas context
		var canvas = document.getElementById('myCanvas');
		var ctx = canvas.getContext('2d');
	
		canvas.width = window.innerWidth - 210;	
		canvas.height = window.innerHeight - 20;
		canvas.x = 0;
		canvas.y = 0;
			
		//Establishes map canvas
		var map = document.getElementById('map');
		var ctx2 = map.getContext('2d');
			
		var restrictTo = "none";
		var action = "";
		
		//Define view for map
		var view = {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		}
		
		//Define select
		var select = {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			//aspect: (2/3),
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
			image.aspect = image.width/image.height;
			
			//Size and position image to fit image inside canvas
			var imageTemp1 = adjustToAspect(canvas.width, canvas.height, image.aspect);
			image.adjW = imageTemp1.width;
			image.adjH = imageTemp1.height;
			image.x = imageTemp1.x;
			image.y = imageTemp1.y;
			
			//Size and position image to fit image inside map
			var imageTemp2 = adjustToAspect(map.width, map.height, image.aspect);
			image.mapW = imageTemp2.width;
			image.mapH = imageTemp2.height;
			image.mapX = imageTemp2.x;
			image.mapY = imageTemp2.y;
			
			//Define initial zoom of image
			image.zoom = image.adjW/image.width; // or could be = image.adjH/image.height;
			drawCanvas();
		}
		
		//debug settings
		$(document).mousemove(function() {
			var adjSelect = translateCoords(select.x, select.y, select.width, select.height);
			var adjSelectX = Math.round((adjSelect.x - image.x) / image.zoom);
			var adjSelectY = Math.round((adjSelect.y - image.y) / image.zoom);
			var adjSelectH = Math.round(adjSelect.height / image.zoom);
			var adjSelectW = Math.round(adjSelect.width / image.zoom);
			$('#info1').html('Select X:' + adjSelectX);	
			$('#info2').html('Select Y:' + adjSelectY);
			$('#info3').html('Select Width:' + adjSelectW);	
			$('#info4').html('Select Height:' + adjSelectH);
			$('#info5').html('Image Zoom:' + Math.round(image.zoom *1000)/10);	
		});

		//////////////
		/// Events ///
		//////////////
		
		$(window).resize(function() {
			canvas.width = window.innerWidth - 210;	
			canvas.height = window.innerHeight - 20;
			
			if(document.getElementById('zoomToFit').checked) {
				zoomToFit();
		 	} else {
				image.adjW = image.zoom * image.width; 
				image.adjH = image.zoom * image.height;
				var selectOffsetX = image.x - select.x;
				var selectOffsetY = image.y - select.y;
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
				select.x = selectOffsetX - image.x;
				select.y = selectOffsetY - image.y;
				
			}
			
			drawCanvas();
		});

		$(canvas).mousedown(function(){
			
			if(document.getElementById('select').checked) {
			  action = "select";
			} else if(document.getElementById('translate').checked) {
			  action = "translate";
			 }else if(document.getElementById('zoom').checked) {
			  action = "zoom";
			}else if(document.getElementById('zoomToFit').checked) {
			  action = "zoomToFit";
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
				case "zoom":
					zoomCanvas(event);
					break;	
				case "zoomToFit":
					zoomToFit();
					drawCanvas();
					break;	
			}
		});
		
		///////////////////
		/// Draw Canvas ///
		///////////////////
		
		function drawCanvas() {
			ctx.save();
			ctx2.save();
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx2.clearRect(0, 0, map.width, map.height);
			
			//ctx.translate(canvas.x , canvas.y);
			ctx.drawImage(image.img, image.x, image.y, image.adjW, image.adjH);
		
			ctx2.drawImage(image.img, image.mapX, image.mapY, image.mapW, image.mapH);
			Map();
			ctx2.fillStyle = "rgba(0, 0, 0, 0.5)";
			ctx2.fillRect(0, 0, view.x,  map.height);
			ctx2.fillRect(view.x, 0, view.width, view.y);
			ctx2.fillRect(view.x + view.width, 0, map.width - view.width - view.x, map.height);
			ctx2.fillRect(view.x, view.y + view.height, view.width, map.height - view.height - view.y);
			ctx2.strokeStyle = "#ffffff";
			ctx2.strokeRect(view.x + .5, view.y + .5, view.width, view.height);
				
			if (select.exists){
				ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.clearRect(select.x, select.y, select.width, select.height);
				ctx.drawImage(image.img, (select.x - image.x)/image.zoom, (select.y - image.y)/image.zoom, select.width/image.zoom, select.height/image.zoom, select.x, select.y, select.width, select.height);
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
			ctx2.restore();
		}
		
		///////////
		/// Map ///
		///////////
		
		function Map() {
			var delta = image.mapW/image.adjW;
			view.x = Math.round(image.mapX + (canvas.x - image.x) * delta);
			view.y = Math.round(image.mapY + (canvas.y - image.y) * delta);
			view.width = Math.round(canvas.width * delta);
			view.height = Math.round(canvas.height * delta);
		}
		
		/////////////////
		/// Translate ///
		/////////////////
		
		function translateCanvas() {
			getMousePosition();
			var imgOffsetX = image.x - mouse.x;
			var imgOffsetY = image.y - mouse.y;
			var selectOffsetX = select.x - image.x;
			var selectOffsetY = select.y - image.y;
			
			$(document)
			.bind("mousemove.translate", function() {
				getMousePosition();
				image.x = mouse.x + imgOffsetX;
				image.y = mouse.y + imgOffsetY;
			
				if (image.x < 0) {
					if (image.adjW + image.x > canvas.width) {
						image.x = image.x;
					} else {
						image.x = image.adjW > canvas.width ? canvas.width - image.adjW : canvas.width/2 - image.adjW/2;
						imgOffsetX = image.x - mouse.x;
					}
				} else {
	 				image.x = image.adjW < canvas.width ? canvas.width/2 - image.adjW/2 : 0; 
					imgOffsetX = image.x - mouse.x;
				}
				if (image.y < 0) {
					if (image.adjH + image.y > canvas.height) {
						image.y = image.y;
					} else {
						image.y = image.adjH > canvas.height ? canvas.height - image.adjH : canvas.height/2 - image.adjH/2;
						imgOffsetY = image.y - mouse.y
					}
				} else {
	 				image.y = image.adjH < canvas.height ? canvas.height/2 - image.adjH/2 : 0;
					imgOffsetY = image.y - mouse.y
				}
				
				select.x = image.x + selectOffsetX;
				select.y = image.y + selectOffsetY;
				drawCanvas();
			})
			.bind("mouseup.translate", function() {$(document).unbind(".translate");});
		}
	
		////////////
		/// Zoom ///
		////////////
		
		function zoomCanvas(event) {
			var multiplier = (event.altKey || event.shiftKey) ? 0.95 : 1.05;
			
			image.adjTempW = image.zoom * image.width;
			image.adjTempH = image.zoom * image.height; 
			image.zoom *= multiplier;
			image.adjW = image.zoom * image.width;
			image.adjH = image.zoom * image.height;
			
			var zoomDelta = image.adjW / image.adjTempW;

			var selectOffsetX = (select.x - image.x) * zoomDelta;
			var selectOffsetY = (select.y - image.y) * zoomDelta;

			image.tempX = canvas.width/2 - ((canvas.width/2 - image.x) * zoomDelta);
			image.tempY = canvas.height/2 - ((canvas.height/2 - image.y) * zoomDelta);

			if (multiplier >= 1) {
			image.x = image.tempX;
			image.y = image.tempY;
			} else {
				if (image.tempX < 0) {
					if ((image.adjW + image.tempX)  > canvas.width) {
						image.x = image.tempX;
					} else {
						image.x = image.adjW > canvas.width ? canvas.width - image.adjW : canvas.width/2 - image.adjW/2;
					}
				} else {
	 				image.x = image.adjW < canvas.width ? canvas.width/2 - image.adjW/2 : 0; 
				}
				if (image.tempY < 0) {
					if ((image.adjH + image.tempY)  > canvas.height) {
						image.y = image.tempY;
					} else {
						image.y = image.adjH > canvas.height ? canvas.height - image.adjH : canvas.height/2 - image.adjH/2;
					}
				} else {
	 				image.y = image.adjH < canvas.height ? canvas.height/2 - image.adjH/2 : 0; 
				}
			}
			
			select.x = image.x + selectOffsetX;
			select.y =  image.y + selectOffsetY;
			select.width = select.width * zoomDelta;
			select.height = select.height * zoomDelta;
			
			drawCanvas();
		}
		
		///////////////////
		/// Zoom To Fit ///
		///////////////////
		
		function zoomToFit () {
			var adjTempW = image.adjW,			
		  		result = adjustToAspect(canvas.width, canvas.height, image.aspect);
			image.adjW = result.width;
			image.adjH = result.height;
			var delta = image.adjW / adjTempW,
				selectOffsetX = (select.x - image.x) * delta,
				selectOffsetY = (select.y - image.y) * delta;
			image.x = result.x;
			image.y = result.y;
			select.x = image.x + selectOffsetX;
			select.y =  image.y + selectOffsetY;
			select.width = select.width * delta;
			select.height = select.height * delta;
			image.zoom = image.adjW/image.width; // or could be = image.adjH/image.height;
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
				
				var result = restrictXY (image, select, selectOffsetX, selectOffsetY);
				select.x = result.x;
				select.y = result.y;
				selectOffsetX = result.offsetX;
				selectOffsetY = result.offsetY;
				
				drawCanvas();
			})
		 	.bind("mouseup.move", function() {$(document).unbind(".move");});
		}
	
		function startSelect () {
			if (mouseTestZoom(image)) {
				select.x = mouse.x;
				select.y = mouse.y;
				select.exists = true;
				$(document).bind("mousemove.set", sizeSelect)
						   .bind("mouseup.set", endSelect);
			}
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
					select.width = mouse.x-select.x;
					select.height = mouse.y-select.y;
					break;
			}

			var result1 = restrictWH (image, select);
			select.width = result1.width;
			select.height = result1.height;
		
			if (select.aspect) {
				var result2 = adjustToAspect(select.width, select.height, select.aspect);
				select.width = result2.width;
				select.height = result2.height;
			}

			drawCanvas();
		}
		
		function endSelect() {
			$(document).unbind(".set");
			restrictTo = "none";
			if (select.width == 0 && select.height == 0) {
				select.exists = false;
			}
			var result = translateCoords(select.x, select.y, select.width, select.height);
			select.x = result.x;
			select.y = result.y;
			select.width = result.width;
			select.height = result.height;
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
		
		//Restricts child width/height to scaled bounds of parent
		function restrictWH (parent, child) {
			if (child.x + child.width - parent.x > parent.adjW) {
				child.width = parent.x + parent.adjW - child.x;
			} else if (child.x + child.width < parent.x) {
				child.width = parent.x - child.x;
			}
			if (child.y + child.height - parent.y > parent.adjH) {
				child.height = parent.y + parent.adjH - child.y;
			} else if (child.y + child.height < parent.y) {
				child.height = parent.y - child.y;
			}
			var result = {width: child.width, height: child.height};
			return result;
		}
		
		//Restricts child x/y to scaled bounds of parent
		function restrictXY (parent, child, childOffsetX, childOffsetY) {
			if (child.x - parent.x + child.width > parent.adjW) {
				child.x = parent.x + parent.adjW - child.width;
				childOffsetX = child.x - mouse.x;
			} else if (child.x < parent.x) {
				child.x = parent.x;
				childOffsetX = child.x - mouse.x;
			}
			if (child.y - parent.y + child.height > parent.adjH) {
				child.y = parent.y + parent.adjH - child.height;
				childOffsetY = child.y - mouse.y;
			} else if (child.y < parent.y) {
				child.y = parent.y;
				childOffsetY = child.y - mouse.y;
			}
			var result = {x: child.x, y: child.y, offsetX: childOffsetX, offsetY: childOffsetY};
			return result;
		}
		
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
		
		//Determine if mouse is within rect
		function mouseTestZoom(rect) {
			return mouse.x >= rect.x && 
				mouse.y >= rect.y && 
				mouse.x <= (rect.x + rect.adjW) && 
				mouse.y <= (rect.y + rect.adjH);
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