///<reference path="../_ref.ts" />

module tsd {
	'use strict';

	require('date-utils');

	var termExp = /(>=?|<=?|==) *(\d+[\d:;_ \-]+\d)/g;

	var comparators = {
		'<=': function lte(date1:Date, date2:Date) {
			return date1.isBefore(date2) || date1.equals(date2);
		},
		'<': function lt(date1:Date, date2:Date) {
			return date1.isBefore(date2);
		},
		'>=': function gte(date1:Date, date2:Date) {
			return date1.isAfter(date2) || date1.equals(date2);
		},
		'>': function gt(date1:Date, date2:Date) {
			return date1.isAfter(date2);
		},
		'==': function eqeq(date1:Date, date2:Date) {
			return date1.equals(date2);
		}
	};

	export class DateComp {
		operator:string;
		comparator:(date1:Date, date2:Date) => boolean;
		date:Date;

		satisfies(date:Date):boolean {
			return this.comparator(date, this.date);
		}
	}

	/*
	 DateMatcher
	 */
	export class DateMatcher {

		comparators:DateComp[] = [];

		constructor(selector?:string) {
			if (selector) {
				this.extractSelector(selector);
			}
		}

		filter(list:tsd.DefVersion[]):tsd.DefVersion[] {
			return list.filter(this.getFilterFunc());
		}

		best(list:tsd.DefVersion[]):tsd.DefVersion {
			return this.latest(list);
		}

		latest(list:tsd.DefVersion[]):tsd.DefVersion {
			var list = this.filter(list).sort(tsd.DefUtil.fileCommitCompare);
			if (list.length > 0) {
				return list[list.length - 1];
			}
			return null;
		}

		extractSelector(selector:string) {
			xm.assertVar(selector, 'string', 'selector');
			this.comparators = [];
			if (!selector) {
				return;
			}
			//this.beforeDate = beforeDate;
			//this.afterDate = afterDate;
			termExp.lastIndex = 0;
			var match;
			while ((match = termExp.exec(selector))) {
				termExp.lastIndex = match.index + match[0].length;
				xm.assert(xm.hasOwnProp(comparators, match[1]), 'not a valid date comparator in filter {a}', match[0]);

				var comp = new DateComp();
				//cleanup
				comp.date = new Date(match[2].replace(/;_/g, ' '));
				if (!comp.date) {
					xm.throwAssert('not a valid date in filter {a}', match[0]);
				}
				comp.operator = match[1];
				comp.comparator = comparators[match[1]];
				this.comparators.push(comp);
			}
		}

		private getFilterFunc():(file:tsd.DefVersion) => boolean {
			var len = this.comparators.length;
			return (file:tsd.DefVersion) => {
				var date:Date = file.commit.changeDate;
				if (!date) {
					//wyrd
					return false;
				}
				for (var i = 0; i < len; i++) {
					if (!this.comparators[i].satisfies(date)) {
						return false;
					}
				}
				return true;
			};
		}
	}
}
