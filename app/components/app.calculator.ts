import {Component, Input} from 'angular2/core';
import { MongoCalculatorService } from '/app/services/mongocalculator.service';
import { MongoService } from '/app/services/mongo.service';

@Component({
  selector    : 'mdb-calculator',
  templateUrl : '/app/templates/app.calculator.html'
})
export class CalculatorComponent {
  constructor(mongoCalculator: MongoCalculatorService, mongoService: MongoService) {
    this.mongoCalculator  = mongoCalculator;
    this.mongoService = mongoService;
  }
}
