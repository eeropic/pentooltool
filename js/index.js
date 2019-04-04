paper.install(window)
paper.setup("canvas")

document.body.addEventListener("touchstart", null, { passive: false })
document.body.addEventListener("touchmove", null, { passive: false })
document.body.addEventListener("touchend", null, { passive: false })

project.currentStyle = {
	fillColor: "#ff83b4",
	strokeWidth: 0,
	strokeColor: "#666",
	strokeJoin: "round",
	strokeCap: "round"
}

function mapCommands(id, event) {
	let cmds = $(id)
		.children()
		.map(function(idx, elem) {
			return {
				id: $(elem).data().cmd,
				color: $(elem).data().color != null ? $(elem).data().color : null
			}
		})

	if (cmds.length == 0) cmds = [{ id: "draw-path" }]

	for (let cmd of cmds) {
		if (commands[cmd.id] != null) {
			cmd.color == null
				? commands[cmd.id].cmd(event)
				: commands[cmd.id].cmd(event, cmd.color)
		}
	}
}

var penTool = new Tool({ minDistance: 3 })
penTool.text = "Hello World!"
penTool.prevDelta = 0
penTool.currDelta = 0
penTool.avgDelta = 0

//mouse event handling

penTool.on({
	mousedown(e) {
		this.items = []
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
		//console.log(this.items)
		this.items = []
	}
})

//build GUI

$("#components").append(
	Object.keys(commands).map(function(key, index) {
		let obj = commands[key]
		if (key != "color")
			return `<li class="fas btn ${obj.icon}" data-cmd="${key}"/>`
	})
)

//colors
for (let i = 1; i < 6; i++) {
	$("#components").append(
		`<li class="fas btn fa-tint color color-${i}" data-cmd="color" data-color="${i}"/>`
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
		/*
			if ($($item).data().cmd == "create-text") {
				let inputText = prompt("Enter text");
				$($item).attr("data-text", inputText);
				penTool.text = inputText;
			}
    */
		$item.removeClass(container.group.options.draggedClass).removeAttr("style")
		$("body").removeClass(container.group.options.bodyClass)
		if (this.canceled) {
			$item.remove()
			if (this.cloneItem != null && container.target[0].id != "components")
				this.cloneItem.remove()
			this.canceled = false
		} else {
			$($item).on("mousedown touchend", function(e) {
				$("li.btn").each(function(e) {
					$(this).removeClass("select")
				})
				$(this).addClass("select")
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

function onFrame(event) {
	view.update()
}

$(".color").on("mousedown touchend", function(e) {
	$(".color").each(function(e) {
		$(this).removeClass("select")
	})
	$(this).addClass("select")
})

//        $("html").attr("style", "--color-1:hotpink");
