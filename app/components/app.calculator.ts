import {Component, Input} from 'angular2/core';
import { MongoCalculatorService } from '/app/services/mongocalculator.service';

@Component({
  selector    : 'mdb-calculator',
  templateUrl : '/app/templates/app.calculator.html'
})
export class CalculatorComponent {
  constructor(mongoCalculator: MongoCalculatorService) {
    this.mongoCalculator  = mongoCalculator;
  }
}
