var commands = {
	"create-path": {
		cmd: function(e, color) {
			let randomPt = e.tool.randomize
				? e.delta
						.rotate(-90)
						.normalize()
						.multiply(Math.random() * grid * 2 - grid)
				: new Point(0, 0)
			if (e.type == "mousedown") {
				let item = new Path({
					fillColor: e.tool.speed ? color : null,
					strokeWidth: 4,
					strokeColor: e.tool.speed ? null : color,
					strokeJoin: "round",
					strokeCap: "round"
				})
				e.tool.items.push(item)
			} else if (e.type == "mousedrag") {
				if (e.tool.speed) {
					e.tool.items.forEach(function(item) {
						if (item.className == "Path") {
							if (e.count < 5) {
								item.fillColor = e.tool.speed ? color : null
								item.strokeColor = e.tool.speed ? null : color
							}

							item.add(
								e.point.add(
									e.delta
										.rotate(90)
										.normalize()
										.multiply(e.tool.avgDelta)
										.add(randomPt)
								)
							)
							item.insert(
								0,
								e.point.add(
									e.delta
										.rotate(-90)
										.normalize()
										.multiply(e.tool.avgDelta)
										.add(randomPt)
								)
							)
						}
					})
				} else {
					e.tool.items.forEach(function(item) {
						if (item.className == "Path") item.add(e.point.add(randomPt))
					})
				}
			} else if (e.type == "mouseup") {
				e.tool.items.forEach(function(item) {
					if (item.className == "Path") {
						if (!e.tool.speed) item.fillColor = null
						item.closed = false
						if (!e.tool.snap) {
							item.simplify()
						}
						if (e.tool.speed) {
							//item.closed = true
							item.firstSegment.point = e.point
							item.lastSegment.point = e.point
						}
					}
					console.log(item.fillColor)
				})
			}
		},
		icon: "fa-signature"
	},

	"create-circle": {
		cmd: function(e, color) {
			let randomPt = e.tool.randomize
				? e.delta
						.rotate(-90)
						.normalize()
						.multiply(Math.random() * 40)
				: new Point(0, 0)
			let size = e.type == "mousedrag" ? (e.tool.speed ? e.tool.avgDelta : 10) : 10
			let item = new Shape.Circle({
				radius: size,
				position: e.point.add(randomPt),
				strokeWidth: 0,
				fillColor: color
			})
			e.tool.items.push(item)
		},

		icon: "fa-circle"
	},

	"create-square": {
		cmd: function(e, color) {
			let randomPt = e.tool.randomize
				? e.delta
						.rotate(-90)
						.normalize()
						.multiply(Math.random() * grid * 2 - grid)
				: new Point(0, 0)

			let size = e.type == "mousedrag" ? (e.tool.speed ? e.tool.avgDelta : 20) : 20
			let item = new Shape.Rectangle({
				size: [size, size],
				position: e.point.add(randomPt),
				fillColor: color
			})
			if (e.tool.snap) {
				item.position.x = Math.round(item.position.x / grid) * grid
				item.position.y = Math.round(item.position.y / grid) * grid
			} else {
			}
			e.tool.items.push(item)
		},
		icon: "fa-square"
	},

	"create-text": {
		cmd: function(e, color) {
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
					fontSize: e.tool.speed ? Math.max(20, e.tool.avgDelta * 2) : 20,
					strokeWidth: 0,
					content: e.tool.text[e.count % e.tool.text.length],
					fillColor: color
				})

				text.position.x -= text.bounds.width / 2
				e.tool.items.push(text)

				e.tool.guide.add(e.point)
			} else if (e.type == "mouseup") {
				if (e.tool.snap) {
					for (let seg of e.tool.guide.segments) {
						seg.point.x = Math.round(seg.point.x / 40) * 40
						seg.point.y = Math.round(seg.point.y / 40) * 40
					}
				} else {
					e.tool.guide.simplify()
				}
				for (let idx in e.tool.items) {
					if (e.tool.items[idx].className == "PointText") {
						e.tool.items[idx].position = e.tool.guide.getPointAt((e.tool.guide.length / e.tool.items.length) * idx)
					}
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

	"size-from-speed": {
		cmd: function(e, color) {
			e.tool.speed = e.tool.avgDelta
		},
		icon: "fa-signal"
	},

	"snap-grid": {
		cmd: function(e) {
			e.tool.snap = true

			e.tool.items.forEach(function(item) {
				if (item.className == "Path") {
					for (let seg of item.segments) {
						seg.point.x = Math.round(seg.point.x / grid) * grid
						seg.point.y = Math.round(seg.point.y / grid) * grid
					}
				}
			})
		},
		icon: "fa-th"
	},

	"clone-items": {
		cmd: function(e) {
			if (e.type == "mouseup") {
				e.tool.items.forEach(function(elem) {
					let clone = elem.clone()
					clone.segments[0].point.x += 100
				})
			}
		},
		icon: "fa-clone"
	},
	/*
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
	*/
	/*
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
*/

	randomize: {
		cmd: function(e) {
			e.tool.randomize = true
			if (e.type == "mouseup") {
			}
		},
		icon: "fa-dice"
	}
}

var modifiers = {}
