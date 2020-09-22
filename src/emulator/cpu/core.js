import Registers from './registers.js';
import Memory from './memory.js';
import Addressing from './addressing.js';
import { flags } from '../parser/constants.js';

let s = '';
let ans = '';
let ans1 = '';
export default class CPU {
    constructor() {
        this.registers = new Registers();
        this.memory = new Memory();
        this.addressing = new Addressing(this.registers, this.memory);
    }

    loadCode(code) {
        const cs = this.registers.regs.CS.get();
        code.forEach((elem, i) => {
            this.memory.set(cs + i, elem);
        });
    }

    step() {
        const ip = this.registers.regs.IP.get();
        const instruction = this.memory.get(this.registers.regs.CS.get() + ip);

        const { mnemonic, op1, op2 } = instruction;
        const { regs } = this.registers;
        const getAddr = (target) => this.addressing.get(target);
        const setAddr = (target, value) => this.addressing.set(target, value);

        if (!mnemonic) {
            throw SyntaxError('Invalid instruction at the current instruction pointer');
        }

        switch (mnemonic.value) {
        case 'MOV':
            if (op1.size < op2.size) {
                throw SyntaxError(`Can't move larger ${op2.size} bit value to ${op1.size} bit location`);
            }
            setAddr(op1, getAddr(op2));
            break;

        case 'JS':
            if (regs.flags.getFlag(flags.sign) === 1) {
                regs.IP.set(op1);
            }
            break;

        case 'ADD':
            if (!op2) {
                s = op1.size === 8 ? regs.AX.get('l') : regs.AX.get();
                s += getAddr(op1);
                regs.AX.set(s);
            } else {
                s = getAddr(op1);
                s += getAddr(op2);
                setAddr(op1, s);
            }
            break;

        case 'DIV':
            if (op1.size === 8) {
                const al = regs.AX.get() / getAddr(op1);
                const ah = regs.AX.get() % getAddr(op1);
                regs.AX.set(al, 'l');
                regs.AX.set(ah, 'h');
            } else {
                // when operand is a word
            }
            break;

        case 'MUL':
            if (op1.size === 8) {
                const prod = regs.AX.get('l') * getAddr(op1);
                regs.AX.set(prod);
            } else {
                // when operand is a word
                const prod = regs.AX.get() * getAddr(op1);
                regs.AX.set(prod);
            }
            break;

        case 'AND':
            ans = getAddr(op1) & getAddr(op2);
            setAddr(op1, ans);
            break;

        case 'OR':
            ans1 = getAddr(op1) | getAddr(op2);
            setAddr(op1, ans1);
            break;

        default:
            break;
        }

        // Example for setting/unsetting/checking flag register
        // import { flags } from '../parser/constants.js';
        // regs.flags.setFlag(flags.zero);
        // regs.flags.setFlag(flags.auxilliary);
        // regs.flags.unsetFlag(flags.auxilliary);
        // console.log(regs.flags.getFlag(flags.zero));
        regs.IP.set(ip + 1);
    }
}
