import { Product } from '../models';
import { Location } from '../models';

export class AppState {
  private static instance: AppState;

  public products: Product[] = [];
  public locations: Location[] = [];

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }
}
