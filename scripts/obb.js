var obb = function(position, w, h, rotation) {	
	var instance = {
		position: position,
		rotation: rotation,
		w: w,
		h: h,
		color: "black",
		corners: [{x: 0, y: 0}, 
				  {x: 0, y: 0}, 
				  {x: 0, y: 0}, 
				  {x: 0, y: 0}],
		axes: [{x: 0, y: 0}, {x: 0, y: 0}],
		orig: [0, 0],
		setRotation: function(rotation) {
			var i = {x: Math.cos(rotation), y: Math.sin(rotation)};
			var j = {x:-Math.sin(rotation), y: Math.cos(rotation)};
			
			i.x *= w / 2; 
			i.y *= w / 2;
			j.x *= h / 2; 
			j.y *= h / 2;
			
			instance.corners[0].x = instance.position.x - i.x - j.x; 
			instance.corners[0].y = instance.position.y - i.y - j.y;
			instance.corners[1].x = instance.position.x + i.x - j.x; 
			instance.corners[1].y = instance.position.y + i.y - j.y;
			instance.corners[2].x = instance.position.x + i.x + j.x; 
			instance.corners[2].y = instance.position.y + i.y + j.y;
			instance.corners[3].x = instance.position.x - i.x + j.x; 
			instance.corners[3].y = instance.position.y - i.y + j.y;
			
			instance.rotation = rotation;
		},
		setPosition: function(position) {			
			var delta = {x: position.x - instance.position.x, y: position.y - instance.position.y};
			
			for (var i = 0; i < 4; i++) {
				instance.corners[i].x += delta.x; 
				instance.corners[i].y += delta.y;
			}
			instance.position.x = position.x;
			instance.position.y = position.y;
		},
		update: function () {
			instance.axes[0].x = instance.corners[1].x - instance.corners[0].x; 
			instance.axes[0].y = instance.corners[1].y - instance.corners[0].y;
			instance.axes[1].x = instance.corners[3].x - instance.corners[0].x; 
			instance.axes[1].y = instance.corners[3].y - instance.corners[0].y;
			
			for (var i = 0; i < 2; i++) {
				var length = instance.axes[i].x * instance.axes[i].x + instance.axes[i].y * instance.axes[i].y;
				
				instance.axes[i].x /= length; 
				instance.axes[i].y /= length;
				
				instance.orig[i] = instance.corners[0].x * instance.axes[i].x + instance.corners[0].y * instance.axes[i].y;
			}
		}
	};	
	
	instance.setPosition(position);
	instance.setRotation(rotation);
	instance.update();
	
	return instance;
};

var overlaps1D = function(obb1, obb2) {	
	for (var i = 0; i < 2; i++) {
		var t = obb1.axes[i].x * obb2.corners[0].x + obb1.axes[i].y * obb2.corners[0].y;
		var tmin = t;
		var tmax = t;
	
		for (var j = 0; j < 4; j++) {
			t = obb1.axes[i].x * obb2.corners[j].x + obb1.axes[i].y * obb2.corners[j].y;
			if (t < tmin) {
				tmin = t;
			} else if (t > tmax) {
				tmax = t;
			}
		}
	
		if ((tmin > 1 + obb1.orig[i]) || (tmax < obb1.orig[i])) {
			return false;
		}
	}
	return true;
};

obb.hitTest = function(obb1, obb2) {
	return overlaps1D(obb1, obb2) && overlaps1D(obb2, obb1);
};

obb.render = function (g, obb) {
    g.strokeStyle = obb.color;
    g.strokeRect(obb.corners[0].x, obb.corners[0].y, obb.w, obb.h);
};