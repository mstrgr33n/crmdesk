import { Point } from "fabric";

export interface Edge extends Array<Point> {
    0: Point;
    1: Point;
}

export class ClosestPoints {
    // Функция для вычисления расстояния между двумя точками
  private static distance(p1: Point, p2: Point): number {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  // Функция для получения середины отрезка
  private static getMidpoint(edge: Edge): Point {
    return new Point({
      x: (edge[0].x + edge[1].x) / 2,
      y: (edge[0].y + edge[1].y) / 2,
    });
  }

  // Главная функция для поиска ближайших середин отрезков
  public static findClosestMidpoints(edges1Input: Point[], edges2Input: Point[]): [Point, Point] | null {
    // Преобразуем массивы координат в массивы отрезков
    const edges1 = edges1Input.map((_, i) => [edges1Input[i], edges1Input[(i + 1) % edges1Input.length]] as Edge);
    const edges2 = edges2Input.map((_, i) => [edges2Input[i], edges2Input[(i + 1) % edges2Input.length]] as Edge);

    // Находим середины всех отрезков
    const midpoints1 = edges1.map(edge => this.getMidpoint(edge));
    const midpoints2 = edges2.map(edge => this.getMidpoint(edge));

    let minDistance = Infinity;
    let closestMidpoints: [Point, Point] | null = null;

    // Перебираем все возможные пары середин
    for (const mp1 of midpoints1) {
      for (const mp2 of midpoints2) {
        const dist = this.distance(mp1, mp2);

        if (dist < minDistance) {
          minDistance = dist;
          closestMidpoints = [mp1, mp2];
        }
      }
    }

    return closestMidpoints;
  }
}