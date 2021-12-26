import { createActivWidget } from "../lib/ActivWidget";
import { createSlider } from "../lib/Slider";
import { getVolumeIcon, POPUP_ICON_CLASS, POPUP_MENU_ITEM_CLASS, VOLUME_DELTA } from '../consts'
import { mpvHandler } from "../services/mpv/MpvHandler";

const { BoxLayout, Icon, IconType } = imports.gi.St
const { Tooltip } = imports.ui.tooltips
const { KEY_Right, KEY_Left, ScrollDirection } = imports.gi.Clutter

export function createVolumeSlider() {

    const {
        getVolume,
        setVolume,
        addVolumeChangeHandler
    } = mpvHandler

    const container = new BoxLayout({
        style_class: POPUP_MENU_ITEM_CLASS,
    })

    createActivWidget({
        widget: container
    })

    /** in Percent and rounded! */
    // let volume: number

    const slider = createSlider({
        initialValue: getVolume({ dimension: 'fraction' }) || 0,
        onValueChanged: (newValue) => setVolume(newValue * 100)
    })

    const getTooltipTxt = () => {
        return `Volume: ${getVolume()?.toString()} %`
    }

    const tooltip = new Tooltip(slider.actor, getTooltipTxt())
    tooltip.show()

    const icon = new Icon({
        icon_type: IconType.SYMBOLIC,
        style_class: POPUP_ICON_CLASS,
        icon_name: getVolumeIcon({ volume: getVolume() || 0 }),
        reactive: true
    });

    [icon, slider.actor].forEach(widget => {
        container.add_child(widget)
    })

    container.connect('key-press-event', (actor, event) => {
        const key = event.get_key_symbol();

        if (key === KEY_Right || key === KEY_Left) {
            const direction = (key === KEY_Right) ? 'increase' : 'decrease'
            handleDeltaChange(direction)
        }

        return false
    })

    container.connect('scroll-event', (actor, event) => {
        const scrollDirection = event.get_scroll_direction()
        const direction = (scrollDirection === ScrollDirection.UP) ? 'increase' : 'decrease'
        handleDeltaChange(direction)

        return false
    })

    icon.connect('button-press-event', () => {
        slider.setValue(0)

        return false
    })

    function handleDeltaChange(direction: 'increase' | 'decrease') {
        const delta = (direction === 'increase') ? VOLUME_DELTA : -VOLUME_DELTA
        const newValue = slider.getValue() + delta / 100
        slider.setValue(newValue)
    }

    addVolumeChangeHandler((newVolume) => {

        tooltip.set_text(getTooltipTxt())
        slider.setValue(newVolume / 100 , true)
        icon.set_icon_name(getVolumeIcon({ volume: newVolume }))
    })

    return container
}