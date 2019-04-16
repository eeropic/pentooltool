paper.install(window)
paper.setup("canvas")

var drawingData = localStorage.getItem("touchProto")
var textData = localStorage.getItem("touchText")
var commandsData = localStorage.getItem("touchCommands")

if (drawingData != null) {
	project.clear()
	project.importJSON(JSON.parse(drawingData))
}

document.body.addEventListener("touchstart", null, { passive: false })
document.body.addEventListener("touchmove", null, { passive: false })
document.body.addEventListener("touchend", null, { passive: false })

$("#gui, #components, #commands, #colors, #textInputField, #gui-top, #undo, #redo, #clear").on(
	"touchstart touchmove",
	function(e) {
		e.preventDefault()
	}
)

var globalColors = ["#303240", "#0033dd", "#ff83b4", "#ffbb44", "#66dddd"]
globalColors.forEach(function(val, idx) {
	document.documentElement.style.setProperty("--color-" + (idx + 1), val)
})

var grid = 20

function getCommands(id) {
	return $(id)
		.children()
		.map(function(idx, elem) {
			return {
				id: $(elem).data().cmd,
				color: $(elem).attr("data-color") != null ? $(elem).attr("data-color") : null
			}
		})
		.toArray()
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
				var newColor = null
			}
			commands[cmd.id].cmd(event, newColor)
		}
	}
}

var penTool = new Tool({ minDistance: 3 })
penTool.text = null
penTool.prevDelta = 0
penTool.currDelta = 0
penTool.avgDelta = 0
penTool.maxUndoLevels = 10
penTool.history = {
	projects: [project.exportJSON(false)],
	index: 0
}

if (textData != null) {
	penTool.text = textData
	$("#textInputField").val(textData)
}

//mouse event handling

function updateUndoButtons(tool) {
	$("#undo").css("opacity", tool.history.index > 0 && tool.history.projects.length > 0 ? 1 : 0.5)
	$("#redo").css("opacity", tool.history.index < tool.history.projects.length - 1 ? 1 : 0.5)
}

function handleUndoHistory(tool) {
	tool.history.projects.push(project.exportJSON(false))
	tool.history.index = Math.min(tool.history.index + 1, tool.history.projects.length - 1)
	if (tool.history.projects.length > 0 && tool.history.index < Math.max(0, tool.history.projects.length - 1)) {
		tool.history.projects.length = Math.max(1, tool.history.index)
		tool.history.projects.push(project.exportJSON(false))
		tool.history.index = tool.history.projects.length - 1
	} else if (tool.history.projects.length > tool.maxUndoLevels) {
		tool.history.projects.shift()
		tool.history.index = Math.max(0, tool.history.index - 1)
	}
}

penTool.on({
	mousedown(e) {
		this.items = []
		this.speed = false
		this.snap = false
		this.randomize = false
		mapCommands("#commands", e)
		//this.history.projects.length = Math.max(0, this.history.index - 1)
	},
	mousedrag(e) {
		this.prevDelta = this.currDelta
		this.currDelta = e.delta.length
		this.avgDelta = Math.min(64, (this.prevDelta + this.currDelta) / 2)
		mapCommands("#commands", e)
		this.items.map(function(item) {
			item.data.drawing = true
		})
	},
	mouseup(e) {
		mapCommands("#commands", e)
		this.items.map(function(item) {
			item.data.drawing = null
		})
		this.items = []
		handleUndoHistory(this)
		updateUndoButtons(this)
		if (e.count % 10 == 0) localStorage.setItem("touchProto", JSON.stringify(project.exportJSON({ asString: true })))
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

createPath.attr("data-color", 1)
createPath.addClass("color-1 select")

$("#commands").append(createPath)

$(".color")
	.first()
	.addClass("select")

if (commandsData != null) {
	commandsData = JSON.parse(commandsData)

	$("#commands")
		.children()
		.each(function() {
			$(this).remove()
		})

	$("#commands").append(
		commandsData.map(function(entry, index) {
			let obj = commands[entry.id]
			return `<li class="fas block ${
				obj.icon
			} color-${entry.color}" data-cmd="${entry.id}" data-color="${entry.color}"/>`
		})
	)
}

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
		localStorage.setItem("touchCommands", JSON.stringify(getCommands("#commands")))
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

$("ol#commands")
	.find(".block")
	.click(function(e) {
		$("ol#commands")
			.find(".block")
			.each(function(e) {
				$(this).removeClass("select")
			})
		$($(this)).addClass("select")
	})

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
	handleUndoHistory(penTool)
	updateUndoButtons(penTool)
})

$("#undo").click(function() {
	penTool.history.index = Math.max(0, penTool.history.index - 1)
	project.clear()
	project.importJSON(penTool.history.projects[penTool.history.index])
	//logHistory()
	updateUndoButtons(penTool)
})

$("#redo").click(function() {
	penTool.history.index = Math.max(0, Math.min(penTool.history.projects.length - 1, penTool.history.index + 1))
	project.clear()
	project.importJSON(penTool.history.projects[penTool.history.index])
	//logHistory()
	updateUndoButtons(penTool)
})

function logHistory() {
	console.log("i " + penTool.history.index, "len " + penTool.history.projects.length)
}

$(window).on("unload", function(event) {
	localStorage.setItem("touchProto", JSON.stringify(project.exportJSON({ asString: true })))
	localStorage.setItem("touchText", $("#textInputField").val())
	localStorage.setItem("touchCommands", JSON.stringify(getCommands("#commands")))
})

$("#textInputField").on("input", function(event) {
	penTool.text = this.value
	localStorage.setItem("touchText", this.value)
})
