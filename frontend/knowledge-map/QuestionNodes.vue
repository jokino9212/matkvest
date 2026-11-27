<script setup>
import {h,useId} from 'vue';
import {renderNodes} from '../../integrations/v307/visual_nodes.mjs';
const props=defineProps({nodes:{type:Array,required:true}});
const prefix='mk307-'+useId()+'-';
const Draw=()=>renderNodes(h,props.nodes,prefix);
</script>
<template><Draw /></template>
