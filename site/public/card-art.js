window.CardArt = {
  "version": "kanshan-v1",
  "roles": {
    "A": {
      "name": "踏潮者",
      "kind": "输出",
      "attack": 26,
      "probability": 0.1,
      "color": "#b95746",
      "crit_damage": 12
    },
    "D": {
      "name": "逐光者",
      "kind": "输出",
      "attack": 21,
      "probability": 0.25,
      "color": "#bc913b",
      "crit_damage": 16
    },
    "B": {
      "name": "收藏家",
      "kind": "辅助",
      "defense": 6,
      "color": "#387260"
    },
    "C": {
      "name": "药剂师",
      "kind": "辅助",
      "defense": 6,
      "color": "#7e6695"
    },
    "E": {
      "name": "暗黑看山",
      "kind": "输出",
      "attack": 36,
      "probability": 0.2,
      "crit_damage": 20,
      "color": "#cb5d80"
    },
    "F": {
      "name": "狂化之影",
      "kind": "辅助",
      "defense": 9,
      "color": "#9a7bdd"
    }
  },
  "role_descriptions": {
    "A": "稳定攻击、击破与蓄力。",
    "D": "暴击、暴伤与追击。",
    "B": "防御、减伤与反射。",
    "C": "治疗、增强、削弱与净化。"
  },
  "cards": {
    "A01": {
      "name": "攻击卡",
      "role": "A",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋5。",
      "atk": 5
    },
    "A02": {
      "name": "击破卡",
      "role": "A",
      "fee": 3,
      "timing": "攻击",
      "rule": "击破＋8。",
      "br": 8
    },
    "A03": {
      "name": "会心攻击卡",
      "role": "A",
      "fee": 3,
      "timing": "攻击",
      "rule": "攻击＋4，暴击概率＋15个百分点。",
      "atk": 4,
      "prob": 0.15
    },
    "A04": {
      "name": "背水攻击卡",
      "role": "A",
      "fee": 3,
      "timing": "攻击",
      "rule": "揭示时己方生命≤50：攻击＋10；否则攻击＋4。",
      "low": true
    },
    "A05": {
      "name": "蓄力卡",
      "role": "A",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋1；交锋末储备下一次实际攻击＋5，同槽取较大值。",
      "atk": 1,
      "charge_atk": 5
    },
    "A06": {
      "name": "破甲攻击卡",
      "role": "A",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋2，击破＋3。",
      "atk": 2,
      "br": 3
    },
    "A07": {
      "name": "追击卡",
      "role": "A",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋2；己方上一次实际攻击造成过生命伤害时，再＋4。",
      "atk": 2,
      "follow_damage": 4
    },
    "A08": {
      "name": "终结击破卡",
      "role": "A",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋4；揭示时敌方生命≤40，额外击破＋4。",
      "atk": 4,
      "execute_br": 4
    },
    "A09": {
      "name": "强攻卡",
      "role": "A",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋8，本次攻击不能暴击。",
      "atk": 8,
      "ban": true
    },
    "A10": {
      "name": "蓄力增伤卡",
      "role": "A",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋3；本次读取到攻击储备时，再＋4。",
      "atk": 3,
      "charge_bonus": 4
    },
    "D01": {
      "name": "会心射击卡",
      "role": "D",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋4，暴击概率＋10个百分点。",
      "atk": 4,
      "prob": 0.1
    },
    "D02": {
      "name": "暴击强化卡",
      "role": "D",
      "fee": 2,
      "timing": "攻击",
      "rule": "暴击概率＋25个百分点；暴击额外伤害＋4点。",
      "prob": 0.25,
      "crit_damage": 4
    },
    "D03": {
      "name": "暴伤强化卡",
      "role": "D",
      "fee": 3,
      "timing": "攻击",
      "rule": "攻击＋2；暴击额外伤害＋12点。",
      "atk": 2,
      "crit_damage": 12
    },
    "D04": {
      "name": "穿甲卡",
      "role": "D",
      "fee": 3,
      "timing": "攻击",
      "rule": "攻击＋3，击破＋5。",
      "atk": 3,
      "br": 5
    },
    "D05": {
      "name": "蓄能卡",
      "role": "D",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋2；交锋末储备下一次实际攻击的暴击概率＋20个百分点，同槽不叠加。",
      "atk": 2,
      "charge_prob": 0.2
    },
    "D06": {
      "name": "稳定射击卡",
      "role": "D",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋8，本次攻击不能暴击。",
      "atk": 8,
      "ban": true
    },
    "D07": {
      "name": "终结暴击卡",
      "role": "D",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋4；揭示时敌方生命≤40，暴击概率再＋20个百分点。",
      "atk": 4,
      "execute_prob": 0.2
    },
    "D08": {
      "name": "会心击破卡",
      "role": "D",
      "fee": 3,
      "timing": "攻击",
      "rule": "击破＋6，暴击概率＋10个百分点。",
      "br": 6,
      "prob": 0.1
    },
    "D09": {
      "name": "暴击追击卡",
      "role": "D",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋2；己方上一次实际攻击暴击时，再＋5。",
      "atk": 2,
      "follow_crit": 5
    },
    "D10": {
      "name": "蓄能增伤卡",
      "role": "D",
      "fee": 3,
      "timing": "攻击",
      "rule": "攻击＋3，暴击额外伤害＋6点；读取到暴击储备时，攻击再＋3。",
      "atk": 3,
      "focus_bonus": 3,
      "crit_damage": 6
    },
    "B01": {
      "name": "防御卡",
      "role": "B",
      "fee": 2,
      "timing": "支援",
      "rule": "防御＋8。",
      "guard": 8
    },
    "B02": {
      "name": "强化防御卡",
      "role": "B",
      "fee": 3,
      "timing": "支援",
      "rule": "防御＋11。",
      "guard": 11
    },
    "B03": {
      "name": "减伤防御卡",
      "role": "B",
      "fee": 3,
      "timing": "支援",
      "rule": "防御＋5；穿过防御的伤害再减5点，最低0。",
      "guard": 5,
      "dr": 5
    },
    "B04": {
      "name": "反伤卡",
      "role": "B",
      "fee": 3,
      "timing": "支援",
      "rule": "防御＋5；受到生命伤害时反伤6点，不超过本次实际承伤。",
      "guard": 5,
      "thorns": 6
    },
    "B05": {
      "name": "反击蓄力卡",
      "role": "B",
      "fee": 2,
      "timing": "支援",
      "rule": "防御＋4；本次有效格挡大于0时，交锋末储备己方下一次攻击＋4。",
      "guard": 4,
      "retaliation": 4
    },
    "B06": {
      "name": "抗击破卡",
      "role": "B",
      "fee": 2,
      "timing": "支援",
      "rule": "防御＋5；使本次敌方击破减少4，最低0。",
      "guard": 5,
      "resist_break": 4
    },
    "B07": {
      "name": "盾反卡",
      "role": "B",
      "fee": 3,
      "timing": "支援",
      "rule": "防御＋6；有效格挡时盾反5点，不超过本次格挡量。",
      "guard": 6,
      "shield": 5
    },
    "B08": {
      "name": "强效减伤卡",
      "role": "B",
      "fee": 3,
      "timing": "支援",
      "rule": "防御＋3；穿过防御的伤害再减8点，最低0。",
      "guard": 3,
      "dr": 8
    },
    "B09": {
      "name": "应急防御卡",
      "role": "B",
      "fee": 2,
      "timing": "支援",
      "rule": "防御＋7；揭示时己方生命≤50，改为防御＋11。不恢复生命。",
      "guard": 7,
      "low_guard": 11
    },
    "B10": {
      "name": "抗暴击卡",
      "role": "B",
      "fee": 3,
      "timing": "支援",
      "rule": "防御＋4；敌方暴击概率封顶后减30个百分点，最低0。",
      "guard": 4,
      "anticrit": 0.3
    },
    "C01": {
      "name": "治疗卡",
      "role": "C",
      "fee": 2,
      "timing": "支援",
      "rule": "恢复队伍7生命。",
      "heal": 7
    },
    "C02": {
      "name": "攻击增益卡",
      "role": "C",
      "fee": 2,
      "timing": "己攻支援",
      "rule": "攻击＋5；暴击概率＋20个百分点，禁暴击优先。",
      "atk": 5,
      "prob": 0.2
    },
    "C03": {
      "name": "暴伤增益卡",
      "role": "C",
      "fee": 3,
      "timing": "己攻支援",
      "rule": "攻击＋6；暴击额外伤害＋6点。",
      "atk": 6,
      "prob": 0,
      "crit_damage": 6
    },
    "C04": {
      "name": "击破增益卡",
      "role": "C",
      "fee": 2,
      "timing": "己攻支援",
      "rule": "本次己方攻击＋1、击破＋5；药剂本身不启动攻击。",
      "atk": 1,
      "br": 5
    },
    "C05": {
      "name": "治疗增攻卡",
      "role": "C",
      "fee": 2,
      "timing": "己攻支援",
      "rule": "恢复队伍4生命，本次己方攻击＋3。",
      "heal": 4,
      "atk": 3
    },
    "C06": {
      "name": "压制卡",
      "role": "C",
      "fee": 3,
      "timing": "受击支援",
      "rule": "敌方本次攻击力－5，暴击概率封顶后减10个百分点。",
      "weak_now": 5,
      "anticrit": 0.1
    },
    "C07": {
      "name": "强效治疗卡",
      "role": "C",
      "fee": 3,
      "timing": "支援",
      "rule": "恢复队伍10生命。",
      "heal": 10
    },
    "C08": {
      "name": "净化治疗卡",
      "role": "C",
      "fee": 2,
      "timing": "支援",
      "rule": "移除己方已有攻击削弱，恢复5生命；免疫本交锋新附着的延迟削弱。",
      "heal": 5,
      "cleanse": true
    },
    "C09": {
      "name": "削弱卡",
      "role": "C",
      "fee": 2,
      "timing": "支援",
      "rule": "己攻时：令敌方下一次实际攻击力－6；受击时：敌方本次攻击力－6。",
      "weak_now": 6,
      "weak_next": 6
    },
    "C10": {
      "name": "储备药剂卡",
      "role": "C",
      "fee": 2,
      "timing": "支援",
      "rule": "恢复2生命；交锋末储备下一次实际攻击＋4、暴击概率＋15个百分点，同槽不叠加。",
      "heal": 2,
      "potion": [
        4,
        0.15
      ]
    },
    "E01": {
      "name": "狂爪卡",
      "role": "E",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋9。",
      "atk": 9
    },
    "E02": {
      "name": "裂甲卡",
      "role": "E",
      "fee": 3,
      "timing": "攻击",
      "rule": "攻击＋3，击破＋9。",
      "atk": 3,
      "br": 9
    },
    "E03": {
      "name": "怒袭卡",
      "role": "E",
      "fee": 3,
      "timing": "攻击",
      "rule": "攻击＋4；暴击概率＋20个百分点，额外暴伤＋4。",
      "atk": 4,
      "prob": 0.2,
      "crit_damage": 4
    },
    "E04": {
      "name": "暗潮卡",
      "role": "E",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋3；储备下次攻击＋7。",
      "atk": 3,
      "charge_atk": 7
    },
    "E05": {
      "name": "决意卡",
      "role": "E",
      "fee": 2,
      "timing": "攻击",
      "rule": "攻击＋13；本次不能暴击。",
      "atk": 13,
      "ban": true
    },
    "F01": {
      "name": "黑盐护甲卡",
      "role": "F",
      "fee": 3,
      "timing": "支援",
      "rule": "防御＋9。",
      "guard": 9
    },
    "F02": {
      "name": "棘甲卡",
      "role": "F",
      "fee": 3,
      "timing": "支援",
      "rule": "防御＋5；反伤5，不超过实际承伤。",
      "guard": 5,
      "thorns": 5
    },
    "F03": {
      "name": "侵蚀卡",
      "role": "F",
      "fee": 3,
      "timing": "支援",
      "rule": "己攻：敌方下次攻击－7；受击：敌方本次攻击－7。",
      "weak_now": 7,
      "weak_next": 7
    },
    "F04": {
      "name": "再生卡",
      "role": "F",
      "fee": 3,
      "timing": "支援",
      "rule": "恢复12生命，受治疗总量与生命上限限制。",
      "heal": 12
    },
    "F05": {
      "name": "封光卡",
      "role": "F",
      "fee": 3,
      "timing": "支援",
      "rule": "防御＋5；敌方暴击概率封顶后减20个百分点。",
      "guard": 5,
      "anticrit": 0.2
    }
  }
};
