//lifetimes
import { pageLifetimes } from './lifecycle/pageLifetimes';

//methods
import { clone } from './methods/clone';
import { handleDataset } from './methods/dataset';
import { escape2Html, html2Escape } from './methods/escape';
import { parseEventDynamicCode } from './methods/event';
import { getTabBar } from './methods/getTabBar';
import { getRelationNodes } from './methods/relation';
import { selectComponent as zpSelectComponent,
	selectAllComponents as zpSelectAllComponents } from './methods/selectComponent';
import { setData } from './methods/setData';

export default {
	// #ifndef VUE3
	install(Vue, option) {
		Vue.mixin({
			...pageLifetimes,
			methods: {
				clone,
				handleDataset,
				escape2Html,
				html2Escape,
				parseEventDynamicCode,
				getTabBar,
				getRelationNodes,
				zpSelectComponent,
				zpSelectAllComponents,
				setData
			}
		})
	}
	// #endif

	// #ifdef VUE3
	...pageLifetimes,
	methods: {
		clone,
		handleDataset,
		escape2Html,
		html2Escape,
		parseEventDynamicCode,
		getTabBar,
		getRelationNodes,
		zpSelectComponent,
		zpSelectAllComponents,
		setData
	}
	// #endif
}

