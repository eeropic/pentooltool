paper.install(window)
paper.setup("canvas")

document.body.addEventListener("touchstart", null, { passive: false })
document.body.addEventListener("touchmove", null, { passive: false })
document.body.addEventListener("touchend", null, { passive: false })

$("#gui, #components, #commands, #colors").on("touchstart touchmove", function(e) {
	e.preventDefault()
})

var globalColors = ["#303240", "#0033dd", "#ff83b4", "#eebb44", "#33ddff"]
globalColors.forEach(function(val, idx) {
	document.documentElement.style.setProperty("--color-" + (idx + 1), val)
})

var grid = 20

project.currentStyle = {
	fillColor: globalColors[0],
	strokeColor: globalColors[0],
	strokeWidth: 0,
	strokeJoin: "round",
	strokeCap: "round"
}

function mapCommands(id, event) {
	let cmds = $(id)
		.children()
		.map(function(idx, elem) {
			return {
				id: $(elem).data().cmd,
				color: $(elem).attr("data-color") != null ? $(elem).attr("data-color") : null
			}
		})

	for (let cmd of cmds) {
		if (commands[cmd.id] != null) {
			if (cmd.color != null) {
				if (cmd.color == 6) {
					var newColor = globalColors[event.count % globalColors.length]
				} else {
					var newColor = globalColors[cmd.color - 1]
				}
			} else {
				var newColor = project.currentStyle.fillColor
			}
			commands[cmd.id].cmd(event, newColor)
		}
	}
}

var penTool = new Tool({ minDistance: 2 })
penTool.text = "Hello World!"
penTool.prevDelta = 0
penTool.currDelta = 0
penTool.avgDelta = 0

//mouse event handling

penTool.on({
	mousedown(e) {
		this.items = []
		this.speed = false
		this.snap = false
		this.randomize = false
		mapCommands("#commands", e)
	},
	mousedrag(e) {
		this.prevDelta = this.currDelta
		this.currDelta = e.delta.length
		this.avgDelta = (this.prevDelta + this.currDelta) / 2
		mapCommands("#commands", e)
	},
	mouseup(e) {
		mapCommands("#commands", e)
		this.items = []
	}
})

//build GUI

$("#components").append(
	Object.keys(commands).map(function(key, index) {
		let obj = commands[key]
		if (key != "color") {
			return `<li class="fas block ${obj.icon}" data-cmd="${key}"/>`
		}
	})
)

//colors
for (let i = 1; i <= globalColors.length + 1; i++) {
	$("#colors").append(`<li class="fas block color color-${i}" data-cmd="color" data-color="${i}"/>`)
}

//default tool

let createPath = $("#components li")
	.first()
	.clone()

createPath.addClass("color-1 select")

$("#commands").append(createPath)

$(".color")
	.first()
	.addClass("select")

//GUI drag & drop handling

$("ol.commands").sortable({
	group: "simple_with_animation",
	pullPlaceholder: false,
	vertical: false,
	onDragStart: function($item, container, _super) {
		this.canceled = false
		var offset = $item.offset(),
			pointer = container.rootGroup.pointer
		adjustment = {
			left: pointer.left - offset.left,
			top: pointer.top - offset.top
		}
		if (!container.options.drop) {
			this.cloneItem = $item.clone().insertAfter($item)
		}
		_super($item, container)
	},
	onDrag: function($item, position) {
		$item.css({
			left: position.left - adjustment.left,
			top: position.top - adjustment.top - 16
		})
	},
	onCancel: function($item, container, _super, event) {
		this.canceled = true
	},
	onDrop: function($item, container, _super, event) {
		$item.removeClass(container.group.options.draggedClass).removeAttr("style")
		$("body").removeClass(container.group.options.bodyClass)
		if (this.canceled) {
			$item.remove()
			if (this.cloneItem != null && container.target[0].id != "components") this.cloneItem.remove()
			this.canceled = false
		} else {
			let selectedColor = $("#colors .select")
				.first()
				.data("color")

			if (
				$($item)
					.data("cmd")
					.includes("create")
			) {
				$("li.block")
					.not(".color")
					.each(function(e) {
						$(this).removeClass("select")
					})
				$($item).addClass("select")
				$($item).attr("data-color", selectedColor)
				$($item).addClass("color-" + selectedColor)
			}

			$($item).on("mousedown touchend", function(e) {
				if (
					$($item)
						.data("cmd")
						.includes("create")
				) {
					$("li.block")
						.not(".color")
						.each(function(e) {
							$(this).removeClass("select")
						})
					$(this).addClass("select")
				}
			})
		}
		this.cloneItem = null
	}
})

$("ol.components").sortable({
	group: "simple_with_animation",
	drop: false,
	pullPlaceholder: false,
	vertical: false
})

/*
$("ol.components").click(function(e) {
  //console.log(this, e)
  let clone = e.target.cloneNode(true)
  console.log(e)
  $("ol.commands").append(clone)
})
*/

function onFrame(event) {
	view.update()
}

$(".color").on("mousedown touchend", function(e) {
	e.preventDefault()
	$(".color").each(function(e) {
		$(this).removeClass("select")
	})
	$(this).addClass("select")
	let colorIdx = $(this).attr("data-color")
	let colorHex = globalColors[colorIdx]

	//if ($(".commands .select").length > 0) project.currentStyle.fillColor = colorHex

	$(".commands .select").each(function() {
		if (
			$(this)
				.data("cmd")
				.includes("create")
		) {
			$(this).removeClass("color-1 color-2 color-3 color-4 color-5 color-6")
			$(this).addClass("color-" + colorIdx)
			$(this).attr("data-color", colorIdx)
		}
	})
})

$("#clear-canvas").click(function() {
	project.clear()
})

//        $("html").attr("style", "--color-1:hotpink");

/*
      let bodyStyles = window.getComputedStyle(document.body)
      let color = 
      project.currentStyle.fillColor = color
      project.currentStyle.strokeColor = color
      */
