import Vue from 'vue';

//lifetimes
import { pageLifetimes } from './lifecycle/pageLifetimes';

//methods
import { clone } from './methods/clone';
import { handleDataset } from './methods/dataset';
import { escape2Html, html2Escape } from './methods/escape';
import { parseEventDynamicCode } from './methods/event';
import { getTabBar } from './methods/getTabBar';
import { getRelationNodes } from './methods/relation';
import { selectComponent as zpSelectComponent, selectAllComponents as zpSelectAllComponents } from './methods/selectComponent';
import { setData } from './methods/setData';

// console.log("lifecycle", lifecycle)
export default Vue.extend({
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
});
