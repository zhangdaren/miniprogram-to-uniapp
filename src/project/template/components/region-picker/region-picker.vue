<template name="regionPicker">
	<view>
	    <picker mode="multiSelector" :range="range" :value="dataValue" :disabled="dataDisabled" @change="region_change" @columnchange="region_change_col" @cancel="region_cancel">
			<slot></slot>
		</picker>
	</view>
</template>
<script>
import zones_data from './region-picker.js';
export default {
	name: "regionPicker",
    behaviors: ['uni://form-field'],  //目前仅支持 微信小程序、QQ小程序、百度小程序、h5。
	props: {
		value:{ type: [Array,String,Number], default: [0,0,0] },
		disabled:{ type: Boolean, default: false },
		//like https://api.591tuangou.com/cache/region-picker.php
		jsonPath:{ type:String, default: null },
		jsonData:{ type:Array, default: null },
	},
	data(){
		return {
			dataValue:[],
			dataDisabled:false,
			range:[],
			zones_tree:[],
		}
	},
	mounted:function(e){
		if(this.jsonData){
			this.zones_tree=this.jsonData;
			this.dataDisabled=this.disabled;
			this.value_format();
			this.range_set();
		}else if(this.jsonPath){
			uni.request({
				url:this.jsonPath,
				success:res=>{
					this.zones_tree=res.data;
					this.dataDisabled=this.disabled;
					this.value_format();
					this.range_set();
				}
			})
		}else{
			this.zones_tree=zones_data.zones_tree,
			this.dataDisabled=this.disabled;
			this.value_format();
			this.range_set();
		}
	},
	watch:{
		jsonData:function (nv,ov){
			this.zones_tree=nv;
			this.dataDisabled=this.disabled;
			this.value_format();
			this.range_set();
		},
		value:function (nv,ov){
			if(JSON.stringify(nv)!=JSON.stringify(ov)){
				if(typeof(nv)!='object' && typeof(ov)=='object' && ov[2]+''!=nv+''){
					this.value=nv;
					this.value_format();
					this.range_set();
					this.region_change({detail:{value:this.dataValue}})
				}
			}
		}
	},
	methods: {
		value_format(){
			var value=this.value;
			if(typeof(value)=='number'){
				value=value+'';
			}
			if(typeof(value)=='string' && value.indexOf(',')>0){
				value=value.split(',');
			}
			var sk=0,ck=0,zk=0;
			if(typeof(value)=='string'){
				this.zones_tree.forEach((sv,si)=>{
					sv.children.forEach((cv,ci)=>{
						cv.children.forEach((zv,zi)=>{
							if(zv.code==value){
								sk=si;
								ck=ci;
								zk=zi;
							}
						})
					})
				})
				this.dataValue=[sk,ck,zk];
			}else if(typeof(value[0])=='string' || value[0]>999){
				this.zones_tree.forEach((sv,si)=>{
					if(sv.code==value[0]){
						sk=si;
						sv.children.forEach((cv,ci)=>{
							if(cv.code==value[1]){
								ck=ci;
								cv.children.forEach((zv,zi)=>{
									if(zv.code==value[2]){
										zk=zi;
									}
								})
							}
						})
					}
				})
				this.dataValue=[sk,ck,zk];
			}else{
				this.dataValue=value;
			}
		},
		range_set() {
			var zones_ary=[[],[],[]];
			this.zones_tree.forEach((sv,si)=>{
				zones_ary[0].push(sv.name);
				if(si==this.dataValue[0]){
					sv.children.forEach((cv,ci)=>{
						zones_ary[1].push(cv.name);
						if(ci==this.dataValue[1]){
							cv.children.forEach((zv,zi)=>{
								zones_ary[2].push(zv.name);
							})
						}
					})
				}
			})
			this.range=zones_ary;
		},
		region_change(e){
			var v=e.detail.value;
			var value=[],code=[]
			var sv=this.zones_tree[v[0]]
			value.push(sv.name)
			code.push(sv.code)
			var cv=sv.children[v[1]];
			value.push(cv.name)
			code.push(cv.code)
			var zv=cv.children[v[2]];
			value.push(zv.name)
			code.push(zv.code)
			e.detail={code:code,value:value,data:zv}
			this.$emit('change',e)
		},
		region_change_col(e){
			if (e.detail.column === 0) {
				this.dataValue[1] = 0;
				this.dataValue[2] = 0;
			}
			if (e.detail.column === 1) {
				this.dataValue[2] = 0;
			}
			this.dataValue[e.detail.column]=e.detail.value
			this.range_set();
			this.$emit('columnchange',e)
		},
		region_cancel(e){
			this.$emit('cancel',e)
		},
	}
}
</script>
<style>
</style>
