
module.exports = function supergun(mod) {
	
	//Variables
	let cid
	let myPosition
	let myAngle
	let enabled = true
	let distance = 1000
	let combo_targets = []
	let combo_endpoints = []
	let burst_packet = {}
	let BFid = 51021
	
	//IDs
	let missiles_press_id = 91000
	let burst_fire_id = 51010
	let targeted_bf_id = 51020
	let ab_start_id = 71101
	let ab_ex_id = 71103
	let ab_proj_id = 71120
	
	
	
	//Boss
	let bossid
	let bossloc
	let monsters = []
	let block_hit = false

	
	mod.command.add('gunno', () => {
		enabled = !enabled
		mod.command.message(`Salchy's gunner mod is now ${(enabled) ? 'en' : 'dis'}abled.`)
	})
	
	mod.hook('S_LOGIN', 14, (event) => {
		cid = event.gameId
	})
	
	mod.hook('S_PLAYER_CHANGE_STAMINA', 1, (event) => {
		if(mod.game.me.class !== 'engineer') return
		if(event.current<=60) mod.clearAllIntervals()

	})	
	
	mod.hook('S_SKILL_CATEGORY', 4, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		
	})
	
	mod.hook('S_START_COOLTIME_SKILL', 3, {order: -999999}, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
	})

	mod.hook('S_SPAWN_NPC', 12, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return		
		monsters.push({ gameId: event.gameId, loc: event.loc })
	})
	mod.hook('S_BOSS_GAGE_INFO', 3, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		if(bossid && bossid == event.id) return
		bossid = event.id
		mod.send("S_CUSTOM_STYLE_SYSTEM_MESSAGE", 1, {
			message: "Boss detected",
			style: 54
		})
		mod.send("S_PLAY_SOUND", 1, {
			SoundID: 2023
		})		
		let monster = monsters.find(m => m.gameId === event.id)
		if (monster) bossloc = monster.loc		
				
		
	})

	mod.hook('S_NPC_LOCATION', 3, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		let monster = monsters.find(m => m.gameId === event.gameId)
		if (monster) monster.loc = event.loc
		if(bossid == event.gameId) bossloc = event.loc		
	})
	mod.hook('S_DESPAWN_NPC', 3, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		monsters = monsters.filter(m => m.gameId != event.gameId)
		if(bossid == event.gameId) { 
			bossid = null
			bossloc = null
		}	
	})
	
	mod.hook('S_START_USER_PROJECTILE', 9, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		if(!bossid) return
		if(event.gameId!=mod.game.me.gameId) return
		if(event.skill.id==ab_proj_id && bossloc) {
		
			mod.send('C_START_INSTANCE_SKILL_EX', 5, {
				skill: {
					reserved: 0,
					npc: false,
					type: 1,
					huntingZoneId: 0,
					id: ab_ex_id
				},
				projectile: event.id,
				loc: myPosition,
				dest: bossloc,
				w: myAngle,
				unk: false				
			})
		}
		
		let targets = []		
			targets.push({
				gameId: bossid
			})			
		
		if(!targets[0]) {
			return
		} else {
			mod.send('S_START_USER_PROJECTILE', 9, event)
			mod.send('C_HIT_USER_PROJECTILE', 4, {
				id: event.id,
				end: event.end,
				loc: bossloc,
				targets: targets
			})			
			return false	
		}
	})	

	mod.hook('S_ACTION_STAGE', 9, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		if(bossid == event.gameId) bossloc = event.loc
		/*if(event.gameId==mod.game.me.gameId && event.skill.id==missiles_press_id && event.stage==1) {
			mod.send('C_PRESS_SKILL', 4, {
				skill: {
					reserved: 0,
					npc: false,
					type: 1,
					huntingZoneId: 0,
					id: missiles_press_id
				},
				press: false,
				loc: myPosition,
				w: myAngle								
			})
		}*/		
	})		

	mod.hook('S_ACTION_END', 5, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		if(bossid == event.gameId) bossloc = event.loc
	})
	

	
	mod.hook('C_PLAYER_LOCATION', 5, (event) => {
		myPosition = event.loc
		myAngle = event.w
	})
	
	mod.hook('C_START_SKILL', 7, { order: -1000 }, (event) => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		mod.clearAllIntervals()
		myPosition = event.loc
		myAngle = event.w
	})
	
	mod.hook('C_START_COMBO_INSTANT_SKILL', 6, { order: -1000 }, (event) => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		mod.clearAllIntervals()
		myPosition = event.loc
		myAngle = event.w
		if((Math.floor(event.skill.id/10000)==5)) {
			combo_targets = event.targets
			combo_endpoints = [myPosition]
			BFid = 51021
			mod.setInterval(burstFire, 5)
			return false
		}
	})	

	mod.hook('C_START_INSTANCE_SKILL', 7, { order: -1000 }, (event) => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		mod.clearAllIntervals()
		myPosition = event.loc
		myAngle = event.w
	})

	mod.hook('C_PRESS_SKILL', 4, { order: -1000, filter: { fake: false } }, (event) => {
		if(!enabled) return
		if(mod.game.me.class !== 'engineer') return
		mod.clearAllIntervals()
		myPosition = event.loc
		myAngle = event.w
		/*if(event.skill.id==missiles_press_id && !event.press) {
			return false
		}*/
		
	})

    function getSkillInfo(id) {
		let nid = id;
        return {
            id: nid,
            group: Math.floor(nid / 10000),
            level: Math.floor(nid / 100) % 100,
            sub: nid % 100
        };
    }

    function burstFire(event) {									
		burst_packet = {	
			skill: {
				reserved: 0,
				npc: false,
				type: 1,
				huntingZoneId: 0,
				id: BFid
			},
			loc: myPosition,
			w: myAngle,
			targets: combo_targets,
			endpoints: combo_endpoints
		}
		mod.send('C_START_COMBO_INSTANT_SKILL', 6, burst_packet)
	}
	
}
