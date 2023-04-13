import _get from 'lodash/get'
import _set from 'lodash/set'
import _isEmpty from 'lodash/isEmpty'
import _isEqual from 'lodash/isEqual'
import _forEach from 'lodash/forEach'
import _isUndefined from 'lodash/isUndefined'
import _flattenDeep from 'lodash/flattenDeep'
import _toString from 'lodash/toString'
import _has from 'lodash/has'
import _includes from 'lodash/includes'
import _keys from 'lodash/keys'
import _isFunction from 'lodash/isFunction'
import _uniq from 'lodash/uniq'
import _flatMap from 'lodash/flatMap'
import _union from 'lodash/union'
/**
 * @desc
 * Vue 跨组件通信插件
 */
let unicomIdName = ''
let unicomGroupName = ''
// vm容器、分组、事件、命名 唯一、推迟触发的事件
const [vmMap, groupForVm, events, idForVm, sendDefer] = [new Map(), {}, {}, {}, []]
/**
 * @desc 触发执行事件
 * @param {string} method - 指令的名称
 * @param {string} toKey - 目标组件的 unicomId 或者 unicomGroup
 * @param {string} aim - 标识 （#）
 * @param {Array} args - 参数
 */
const emitEvent = function (method, toKey, aim, args) {
  const evs = _get(events, method, [])
  let evLen = 0
  const len = evs.length
  // 循环已经注册的指令
  for (evLen; evLen < len; evLen++) {
    // 存储的数据
    const { fn, scope } = evs[evLen]
    if (_isEqual(aim, '#')) {
      // id
      if (scope[unicomIdName] !== toKey) {
        // 目标不存在
        continue
      }
    } else if (_isEqual(aim, '@')) {
      // 分组
      const group = _get(vmMap.get(scope), 'group', [])
      if (_isEmpty(group) || _isEqual(_includes(group, toKey), false)) {
        // 目标不存在
        continue
      }
    }
    _isEqual(_isUndefined(scope), false) && fn.apply(scope, args)
  }
  // 返回被触发的指令
  return evLen
}
/**
 * @desc 发送容器 或者 获得 目标容器
 * @param {string} query - 指令名称 （~instruct1#id1）
 * @param  {...any} args - 可变参数
 */
const unicomQuery = function (query, ...args) {
  let [toKey, aim, defer, eventIndex] = ['', '', false, -1]
  // query=instruct1#id1
  const method = query
    .replace(/^([`~])/, function (s0, s1) {
      // query=~instruct1#id1
      if (_isEqual(s1, '~')) {
        defer = true
      }
      return ''
    })
    .replace(/([@#])([^@#]*)$/, function (s0, s1, s2) {
      // query=instruct1@child-a
      // s0=@child-a s1=@ s2=child-a
      toKey = s2
      aim = s1
      return ''
    })
  // method=instruct1
  if (defer) {
    sendDefer.push([method, toKey, aim, args, this])
    return this
  }
  if (_isEqual(_isEqual(method, ''), false)) {
    args.unshift(this)
    eventIndex = emitEvent(method, toKey, aim, args)
  }
  // 获取目标 vm
  switch (aim) {
    case '#':
      return _get(idForVm, toKey, null)
    case '@':
      return _get(groupForVm, toKey, [])
  }
  return eventIndex
}
/**
 * @desc 更新分组
 * @param {Object} scope - 组件的实例
 * @param {string[]} nv - 指令 unicom-group 传入的组数据 （新）
 * @param {string[]} [ov] - 指令 unicom-group 传入的组数据 （旧）
 */
const updateName = function (scope, nv, ov) {
  // 实例上设置分组
  const vmData = vmMap.get(scope) || {}
  const group = _get(vmData, 'group', [])
  // 删除旧的 vm
  if (_isEqual(_isUndefined(ov), false)) {
    _uniq(_flattenDeep(_flatMap(ov))).forEach(function (key) {
      if (_includes(group, key)) {
        const vms = _get(groupForVm, key, [])
        _isEqual(_isEmpty(vms), false) && vms.splice(vms.indexOf(scope), 1)
        if (_isEmpty(vms)) {
          group.splice(group.indexOf(key), 1)
          Reflect.deleteProperty(groupForVm, key)
        }
      }
    })
  }
  // 增加新的
  if (_isEqual(_isUndefined(nv), false)) {
    _uniq(_flattenDeep(_flatMap(nv))).forEach(function (key) {
      const vms = _get(groupForVm, key, [])
      if (_isEmpty(vms)) {
        _set(groupForVm, key, vms)
      }
      // 新添加 组件 到组里面
      if (_isEqual(_includes(vms, scope), false)) {
        vms.push(scope)
      }
      if (_isEqual(_includes(group, key), false)) {
        group.push(key)
      }
    })
  }
}
/**
 * @desc 更新 unicomId
 * @param {Object} scope - 组件的实例
 * @param {string} newValue - 指令 unicom-id 传入的id数据 （新）
 * @param {string} [oldValue] - 指令 unicom-id 传入的id数据 （旧）
 */
const updateId = function (scope, newValue, oldValue) {
  if (_isEqual(newValue, oldValue)) {
    return
  }
  if (_isEqual(_isUndefined(oldValue), false) && _isEqual(_get(idForVm, oldValue), scope)) {
    // watch 监测值修改需要删除，组件销毁时需要删除
    Reflect.deleteProperty(idForVm, oldValue)
  }
  if (_isEqual(_isUndefined(newValue), false) && _isEqual(_has(idForVm, newValue), false)) {
    _set(idForVm, newValue, scope)
  } else if (_isEqual(_isUndefined(newValue), false) && _has(idForVm, newValue)) {
    console.warn(`${unicomIdName}='${newValue}'的组件已经定义并存在。`)
  }
}
/**
 * @desc 添加事件
 * @param {string} method - 指令的名称
 * @param {function} fn - 指令名称对应的函数
 * @param {Object} scope - 指令名称对应函数所运行的作用域
 */
const appendEvent = function (method, fn, scope) {
  if (_isEqual(_has(events, method), false)) {
    events[method] = []
  }
  if (_isFunction(fn)) {
    events[method].push({ fn, scope, method })
  }
}
/**
 * @desc 移除事件
 * @param {string} method - 指令的名称
 * @param {Object} scope - 指令名称对应函数所运行的作用域
 */
const removeEvent = function (method, scope) {
  const evs = _get(events, method, [])
  if (_isEqual(_isEmpty(evs), false)) {
    for (let i = 0; i < evs.length; i++) {
      if (_isEqual(scope, evs[i].scope)) {
        evs.splice(i, 1)
      }
    }
  }
}
export default {
  install (Vue, { name = 'unicom', idName = `${name}Id`, groupName = `${name}Group` } = {}) {
    // 添加原型方法 （unicomQuery 函数放在 install 外部不然无法获取调用函数的 this 对象）
    Vue.prototype['$' + name] = unicomQuery
    // unicom-id
    unicomIdName = idName
    // 分组  unicom-group
    unicomGroupName = groupName
    // 全局混入
    Vue.mixin({
      props: {
        // 命名 unicom-id="id1"
        [idName]: {
          type: String,
          default: ''
        },
        // 分组（纯字符串类数组不能是真实的数组） unicom-group="['child-a', 'child-b']"
        [groupName]: {
          type: Array,
          default: () => []
        }
      },
      watch: {
        [idName] (nv, ov) {
          updateId(this, nv, ov)
        },
        [groupName]: {
          deep: true,
          handler (nv, ov) {
            updateName(this, nv, ov);
          }
        }
      },
      // 创建的时候加入事件机制
      beforeCreate () {
        const opt = this.$options
        const vmData = {}
        const [us, uni, group] = [
          _get(opt, name, {}),
          (vmData.uni = {}),
          (vmData.group = [])
        ]
        if (_isEqual(_isEmpty(us), false)) {
          _forEach(us, opt => {
            if (_isEmpty(opt)) {
              return true
            }
            _forEach(opt, (handler, key) => {
              if (_isEqual(_isUndefined(handler), false)) {
                _isUndefined(_get(uni, key)) && _set(uni, key, [])
                uni[key].push(handler)
                // 添加事件
                appendEvent(key, handler, this)
              }
            })
          })
        }
        // 命名分组
        const groupNameOpt = _get(opt, groupName, [])
        if (_isEqual(_isEmpty(groupNameOpt), false)) {
          _forEach(_uniq(_flattenDeep(_flatMap(groupNameOpt))), item => {
            const key = _toString(item)
            _isUndefined(_get(groupForVm, key)) && (groupForVm[key] = [])
            group.push(key)
            groupForVm[key].push(this)
          })
        }
        if (_isEqual(_isEmpty(group), false) || _isEqual(_isEmpty(uni), false)) {
          vmMap.set(this, vmData)
        }
      },
      created () {
        // 实例命名 唯一
        const uId = this[idName]
        const uGroupName = this[groupName]
        _isEqual(_isEqual(uId, ''), false) && updateId(this, uId)
        _isEqual(_isEmpty(uGroupName), false) && updateName(this, uGroupName)
        // 实例上设置分组
        const vmData = vmMap.get(this) || {}
        for (let i = 0; i < sendDefer.length; i++) {
          const [method, toKey, aim, args, scope] = sendDefer[i]
          let flag = false
          if (_isEqual(aim, '#')) {
            if (_isEqual(toKey, uId)) {
              flag = true
            }
          } else if (_isEqual(aim, '@')) {
            if (
              _isEqual(_isUndefined(_get(vmData, 'group')), false) &&
              _includes(_get(vmData, 'group'), toKey)
            ) {
              flag = true
            }
          } else {
            if (
              _isEqual(method, '') ||
              _includes(_keys(_get(vmData, 'uni', {})), method)
            ) {
              flag = true
            }
          }
          if (flag) {
            // 延后，并且方法为空
            if (_isEqual(method, '')) {
              /**
               * @desc 监听组件事件
               * @example
               * this.$unicom('~#id1', function (childScope) {// unicomId=id1的组件创建完成})
               */
              if (_isFunction(args[0])) {
                args[0](this)
              }
            } else {
              sendDefer.splice(i--, 1)
              args.unshift(scope)
              emitEvent(method, toKey, aim, args)
            }
          }
        }
      },
      // 全局混合，销毁实例的时候销毁事件
      destroyed () {
        // 移除唯一ID
        const uId = this[idName]
        if (_isEqual(_isEqual(uId, ''), false)) {
          updateId(this, undefined, uId)
        }
        // 移除 命名分组、实例命名
        const uGroupName = _get(this, groupName, [])
        const optGroupName = _get(this.$options, groupName, [])
        if (_isEqual(_isEmpty(uGroupName), false) || _isEqual(_isEmpty(optGroupName), false)) {
          updateName(this, undefined, _union(uGroupName, optGroupName))
        }

        const vmData = vmMap.get(this)
        if (_isUndefined(vmData)) {
          return
        }
        vmMap.delete(this)

        const uni = _get(vmData, 'uni', {})
        // 移除事件
        for (const key in uni) {
          removeEvent(key, this)
        }
        // 分组，一对多， 单个vm可以多个分组名称 组件命名
        const group = _get(vmData, 'group', [])
        _forEach(group, function (name) {
          const gs = groupForVm[name]
          if (_isEqual(_isUndefined(gs), false)) {
            const index = gs.indexOf(this)
            if (index > -1) {
              gs.splice(index, 1)
            }
            if (gs.length === 0) {
              delete groupForVm[name]
            }
          }
        })
        // 监控销毁 method为空
        for (let i = 0; i < sendDefer.length;) {
          const pms = sendDefer[i]
          if (_isEqual(pms[0], '') && _isEqual(pms[4], this)) {
            sendDefer.splice(i, 1)
          } else {
            i += 1
          }
        }
      }
    })
    // 自定义属性合并策略
    // 混入（mixins）时不是简单的覆盖而是追加
    const merge = _get(Vue, 'config.optionMergeStrategies', {})
    merge[name] = merge[unicomGroupName] = function (parentVal, childVal) {
      const p = parentVal || []
      if (_isEqual(_isUndefined(childVal), false)) {
        p.push(childVal)
      }
      return p
    }
  }
}
