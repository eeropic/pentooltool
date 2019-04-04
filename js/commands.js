var commands = {
	"draw-path": {
		cmd: function(e) {
			if (e.type == "mousedown") {
				let path = new Path({
					fillColor: null,
					strokeWidth: 4
				})
				e.tool.items.push(path)
			} else if (e.type == "mousedrag") {
				e.tool.items.forEach(function(item) {
					if (item.className == "Path") item.add(e.point)
				})
			} else if (e.type == "mouseup") {
				e.tool.items.forEach(function(item) {
					if (item.className == "Path") {
						let snap = $("#commands")
							.children()
							.filter((idx, e) => {
								return e.getAttribute("data-cmd") == "snap-grid"
							}).length
						if (!snap) item.simplify()
						item.bringToFront()
					}
				})
			}
		},
		icon: "fa-signature"
	},

	"create-circle": {
		cmd: function(e) {
			let circ = new Path.Circle({
				radius: e.type == "mousedrag" ? e.delta.length : 10,
				position: e.point,
				strokeWidth: 0
			})
			circ.sendToBack()
		},

		icon: "fa-circle"
	},

	"create-square": {
		cmd: function(e) {
			let size = e.type == "mousedrag" ? e.delta.length : 10
			let circ = new Path.Rectangle({
				size: [size, size],
				position: e.point
			})
		},
		icon: "fa-square"
	},

	"create-text": {
		cmd: function(e) {
			if (e.type == "mousedown") {
				e.tool.guide = new Path({
					guide: true,
					fillColor: null,
					strokeColor: "#00FFFF",
					strokeWidth: 2
				})
			} else if (e.type == "mousedrag") {
				let text = new PointText({
					position: e.point,
					fontSize: Math.max(20, e.tool.avgDelta * 2),
					strokeWidth: 0,
					content: e.tool.text[e.count % e.tool.text.length]
				})

				text.position.x -= text.bounds.width / 2
				e.tool.items.push(text)

				e.tool.guide.add(e.point)
			} else if (e.type == "mouseup") {
				//console.log("up")
				let snap = $("#commands")
					.children()
					.filter((idx, e) => {
						return e.getAttribute("data-cmd") == "snap-grid"
					}).length

				if (snap) {
					for (let seg of e.tool.guide.segments) {
						seg.point.x = Math.round(seg.point.x / 40) * 40
						seg.point.y = Math.round(seg.point.y / 40) * 40
					}
				} else {
					e.tool.guide.simplify()
				}
				for (let idx in e.tool.items) {
					//console.log(item)
					e.tool.items[idx].position = e.tool.guide.getPointAt(
						(e.tool.guide.length / e.tool.items.length) * idx
					)
				}
				e.tool.guide.remove()
			}
		},
		icon: "fa-font"
	},

	"erase-items": {
		cmd: function(e) {
			let hit = project.hitTest(e.point)
			if (hit && hit.item) {
				hit.item.remove()
			}
		},
		icon: "fa-eraser"
	},

	"snap-grid": {
		cmd: function(e) {
			let hit = project.hitTest(e.point)
			if (hit && hit.item) {
				if (hit.item.className != "Path") {
					hit.item.position.x = Math.round(hit.item.position.x / 16) * 16
					hit.item.position.y = Math.round(hit.item.position.y / 16) * 16
				} else {
					for (let seg of hit.item.segments) {
						seg.point.x = Math.round(seg.point.x / 20) * 20
						seg.point.y = Math.round(seg.point.y / 20) * 20
					}
				}
			}
		},
		icon: "fa-th"
	},

	"clone-items": {
		cmd: function(e) {
			if (e.type == "mouseup") {
				e.tool.items = e.tool.items.map(function(elem) {
					return elem.clone()
				})
			}
		},
		icon: "fa-clone"
	},

	"move-right": {
		cmd: function(e) {
			if (e.type == "mouseup") {
				e.tool.items.forEach(function(elem) {
					elem.position.x += 20
				})
			}
		},
		icon: "fa-arrow-right"
	},

	rotate: {
		cmd: function(e) {
			if (e.type == "mouseup") {
				e.tool.items.forEach(function(elem) {
					elem.rotate(22.5)
				})
			}
		},
		icon: "fa-sync-alt"
	},

	color: {
		cmd: function(e, idx) {
			let colors = $("#commands")
				.children()
				.filter((index, e) => {
					return e.getAttribute("data-cmd") == "color"
				})

			let bodyStyles = window.getComputedStyle(document.body)
			let color = bodyStyles.getPropertyValue(`--color-${idx}`)
			project.currentStyle.fillColor = color
			project.currentStyle.strokeColor = color
			e.tool.items.forEach((e, idx) => {
				e.fillColor =
					e.fillColor != null ? project.currentStyle.fillColor : null
				e.strokeColor = project.currentStyle.strokeColor
			})
		},
		icon: "fa-tint"
	}
}
