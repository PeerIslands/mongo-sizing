import {provide} from 'angular2/core';
import {bootstrap}    from 'angular2/platform/browser'
import {AppDashboard} from '/app/components/app.dashboard'
import {MongoService} from '/app/services/mongo.service';
import {MongoCalculatorService} from './services/mongocalculator.service';
provide(MongoService, {useClass: MongoService})
provide(MongoCalculatorService, {useClass: MongoCalculatorService})
bootstrap(AppDashboard);
